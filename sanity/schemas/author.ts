import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'name' } }),
    defineField({ name: 'picture', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'bio', type: 'text' }),
    defineField({
      name: 'links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'url', type: 'url' }),
          ],
        },
      ],
    }),
  ],
});

