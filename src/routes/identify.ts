import { Router } from "express";
import { identifySchema } from "../schema";
import { prisma } from "../db";

export const identifyRouter = Router();

identifyRouter.post("/", async (req, res) => {
  const parsedBody = identifySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      status: "error",
      message: parsedBody.error.issues.map((i) => i.message).join(", "),
    });
    return;
  }

  const { email, phoneNumber } = parsedBody.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Single query to find all related contacts with their linked contacts
      const matchedContacts = await tx.contact.findMany({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(phoneNumber ? [{ phoneNumber }] : []),
          ],
        },
        include: {
          linkedContacts: true,
          linkedContact: true,
        },
      });

      // 2. No matches - create new primary contact
      if (matchedContacts.length === 0) {
        const newContact = await tx.contact.create({
          data: {
            email,
            phoneNumber,
            linkPrecedence: "primary",
          },
        });

        return {
          contact: {
            primaryContactId: newContact.id,
            emails: [email].filter(Boolean),
            phoneNumbers: [phoneNumber].filter(Boolean),
            secondaryContactIds: [],
          },
        };
      }

      // 3. Build complete contact network from matched results
      const allContactsMap = new Map();
      const primaryContactIds = new Set();

      // Process matched contacts and their relationships
      matchedContacts.forEach((contact) => {
        allContactsMap.set(contact.id, contact);

        if (contact.linkPrecedence === "primary") {
          primaryContactIds.add(contact.id);
        } else if (contact.linkedId) {
          primaryContactIds.add(contact.linkedId);
        }

        // Add linked contacts
        contact.linkedContacts?.forEach((linked) => {
          allContactsMap.set(linked.id, linked);
        });

        if (contact.linkedContact) {
          allContactsMap.set(contact.linkedContact.id, contact.linkedContact);
          primaryContactIds.add(contact.linkedContact.id);
        }
      });

      // 4. Determine the true primary contact (earliest created)
      const primaryCandidates = Array.from(allContactsMap.values())
        .filter((c) => primaryContactIds.has(c.id))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const primaryContact = primaryCandidates[0];

      // 5. Batch update other primaries to secondary (if any)
      const otherPrimaries = primaryCandidates.slice(1);
      if (otherPrimaries.length > 0) {
        await tx.contact.updateMany({
          where: {
            id: { in: otherPrimaries.map((c) => c.id) },
          },
          data: {
            linkPrecedence: "secondary",
            linkedId: primaryContact.id,
          },
        });
      }

      // 6. Check if new contact should be created
      const allContacts = Array.from(allContactsMap.values());
      const existingEmails = new Set(
        allContacts.map((c) => c.email).filter(Boolean)
      );
      const existingPhones = new Set(
        allContacts.map((c) => c.phoneNumber).filter(Boolean)
      );

      const shouldCreateNew =
        (email && !existingEmails.has(email)) ||
        (phoneNumber && !existingPhones.has(phoneNumber)); // Create if phone is new

      let newContactId = null;
      if (shouldCreateNew) {
        // Check if exact combination exists
        const exactMatch = allContacts.some(
          (c) => c.email === email && c.phoneNumber === phoneNumber
        );

        if (!exactMatch) {
          const newContact = await tx.contact.create({
            data: {
              email,
              phoneNumber,
              linkPrecedence: "secondary",
              linkedId: primaryContact.id,
            },
          });
          newContactId = newContact.id;
        }
      }

      // 7. Build final response (no additional DB query needed)
      const allFinalContacts = allContacts.filter(
        (c) => c.id === primaryContact.id || c.linkedId === primaryContact.id
      );

      // Add the new contact if created
      if (newContactId) {
        allFinalContacts.push({
          id: newContactId,
          email,
          phoneNumber,
          linkPrecedence: "secondary",
          linkedId: primaryContact.id,
        });
      }

      const emails = Array.from(
        new Set(allFinalContacts.map((c) => c.email).filter(Boolean))
      );
      const phoneNumbers = Array.from(
        new Set(allFinalContacts.map((c) => c.phoneNumber).filter(Boolean))
      );
      const secondaryContactIds = allFinalContacts
        .filter((c) => c.linkPrecedence === "secondary")
        .map((c) => c.id);

      return {
        contact: {
          primaryContactId: primaryContact.id,
          emails,
          phoneNumbers,
          secondaryContactIds,
        },
      };
    });

    res.json({
      status: "success",
      ...result,
    });
    return;
  } catch (err) {
    console.error("Error identifying contact:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
    return;
  }
});
