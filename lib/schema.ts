import { pgTable, text, integer, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    bio: text("bio"),
    languagePreference: text("language_preference").default("en"), // en, zh, etc.
    role: text("role").default("user"), // user, admin
    createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable(
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

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (verificationToken) => ({
        compositePk: primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    })
);

export const coffeeShops = pgTable("coffee_shops", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    location: text("location").notNull(),
    city: text("city").notNull().default("Taipei"),
    description: text("description").notNull(),
    image: text("image").notNull(),
    rating: integer("rating").notNull(),
    features: text("features").notNull(), // JSON string
});

export const meetups = pgTable("meetups", {
    id: text("id").primaryKey(),
    date: text("date").notNull(), // ISO date string
    time: text("time").notNull(),
    locationId: text("location_id").references(() => coffeeShops.id),
    status: text("status").notNull().default("open"),
    language: text("language").notNull().default("en"),
});

export const bookings = pgTable("bookings", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    meetupId: text("meetup_id").notNull().references(() => meetups.id),
    vibe: text("vibe").notNull(),
    status: text("status").notNull().default("confirmed"),
    createdAt: timestamp("created_at").defaultNow(),
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
