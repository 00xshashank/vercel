import z from 'zod';

export const PostDeployURLType = z.object({
    repoUrl: z.string()
})