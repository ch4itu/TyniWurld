import { pgTable, text, timestamp, serial, integer, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: serial().primaryKey(),
  auth0Id: text('auth0_id').notNull().unique(),
  username: text('username').notNull(),
  displayName: text('display_name').default(''),
  about: text('about').default(''),
  image: text('image').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, table => [
  uniqueIndex('profiles_username_unique').on(table.username),
]);

export const builds = pgTable('builds', {
  id: serial().primaryKey(),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
