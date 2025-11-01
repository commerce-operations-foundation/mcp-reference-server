import { z } from 'zod';

export const TemporalPaginationSchema = z
  .object({
    updatedAtMin: z.iso.datetime().describe('Minimum updated at date (inclusive)'),
    updatedAtMax: z.iso.datetime().describe('Maximum updated at date (inclusive)'),
    createdAtMin: z.iso.datetime().describe('Minimum created at date (inclusive)'),
    createdAtMax: z.iso.datetime().describe('Maximum created at date (inclusive)'),
    pageSize: z.number().int().positive().default(10).describe('Number of results to return per page. Use with skip to paginate through results.'),
    skip: z.number().int().min(0).default(0).describe('Number of results to skip. To navigate to the next page, increment skip by pageSize (e.g., skip=0 for first page, skip=100 for second page when pageSize=100).'),
  })
  .partial();

export type TemporalPaginationInput = z.infer<typeof TemporalPaginationSchema>;
