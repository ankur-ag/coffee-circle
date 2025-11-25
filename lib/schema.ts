import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
    image: text("image"),
    bio: text("bio"),
    languagePreference: text("language_preference").default("en"), // en, zh, etc.
    role: text("role").default("user"), // user, admin
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const accounts = sqliteTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
);

export const sessions = sqliteTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
    },
    (verificationToken) => ({
        compositePk: primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    })
);

export const coffeeShops = sqliteTable("coffee_shops", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    location: text("location").notNull(),
    city: text("city").notNull().default("Taipei"), // Default to Taipei for existing records
    description: text("description").notNull(),
    image: text("image").notNull(),
    rating: integer("rating").notNull(), // Store as integer (e.g. 48 for 4.8) or real
    features: text("features").notNull(), // JSON string
});

export const meetups = sqliteTable("meetups", {
    id: text("id").primaryKey(),
    date: text("date").notNull(), // ISO date string
    time: text("time").notNull(),
    locationId: text("location_id").references(() => coffeeShops.id),
    status: text("status").notNull().default("open"), // open, full, past
    language: text("language").notNull().default("en"), // en, zh, etc.
});

export const bookings = sqliteTable("bookings", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    meetupId: text("meetup_id").notNull().references(() => meetups.id),
    vibe: text("vibe").notNull(), // quiet, social
    status: text("status").notNull().default("confirmed"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
    bookings: many(bookings),
}));

export const coffeeShopsRelations = relations(coffeeShops, ({ many }) => ({
    meetups: many(meetups),
}));

export const meetupsRelations = relations(meetups, ({ one, many }) => ({
    location: one(coffeeShops, {
        fields: [meetups.locationId],
        references: [coffeeShops.id],
    }),
    bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
    user: one(users, {
        fields: [bookings.userId],
        references: [users.id],
    }),
    meetup: one(meetups, {
        fields: [bookings.meetupId],
        references: [meetups.id],
    }),
}));
