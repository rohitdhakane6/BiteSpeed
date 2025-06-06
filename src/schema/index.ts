import { z } from "zod";

export const identifySchema = z.object({
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
}).refine(
    (data) => !!data.email || !!data.phoneNumber,
    { message: "At least one of email or phoneNumber is required." }
);
