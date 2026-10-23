import z from 'zod'

const passwordCreationSchema = z.string()
        .min(8, { message: 'Le mot de passe doit faire au moins 8 caractères' })
        .refine((val) => /[A-Z]/.test(val), { message: 'Le mot de passe doit contenir au moins une majuscule' })
        .refine((val) => /[a-z]/.test(val), { message: 'Le mot de passe doit contenir au moins une minuscule' })
        .refine((val) => /[0-9]/.test(val), { message: 'Le mot de passe doit contenir au moins un chiffre' })

export const UserConnectionSchema = z.object({
    email: z.email(),
    password: z.string()
})

export type UserConnectionType = z.infer<typeof UserConnectionSchema>


export const UserAccountCreationSchema = z.object({
    email: z.email(),
    password: passwordCreationSchema,
    firstName: z.string(),
    lastName: z.string()
})

export type UserAccountCreationType = z.infer<typeof UserAccountCreationSchema>

export const UserResponseSchema = UserAccountCreationSchema
    .omit({ password: true })
    .extend({
    id: z.number(),
    isActive: z.boolean(),
    createdAt: z.date()
})

export type UserResponseType = z.infer<typeof UserResponseSchema>

export const UserAccountUpdateSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    isActive: z.boolean().optional(),
    email: z.email().optional(),
})

export type UserAccountUpdateType = z.infer<typeof UserAccountUpdateSchema>

export const UserAccountUpdatePasswordSchema = z.object({
    password: z.string(),
    newPassword: passwordCreationSchema
})

export type UserAccountUpdatePasswordDtoType = z.infer<typeof UserAccountUpdatePasswordSchema>