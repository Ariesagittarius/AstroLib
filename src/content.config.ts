import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				notices: z.array(z.any()).optional(),
				pageType: z.enum(['book', 'dev', 'technical', 'academic']).optional(),
				noindent: z.boolean().optional(),
			}),
		}),
	}),
};
