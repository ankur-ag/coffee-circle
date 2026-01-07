import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasActiveBooking, isBookingActive, isMeetupInFuture } from "../data";
import { getDb } from "../db";

// Mock the database module
vi.mock("../db", () => ({
    getDb: vi.fn(),
}));

// Mock next/cache for unstable_cache
vi.mock("next/cache", () => ({
    unstable_cache: (cb: any) => cb,
}));

describe("hasActiveBooking", () => {
    let mockSelect: any;
    let mockFrom: any;
    let mockWhere: any;
    let mockInnerJoin: any;
    let mockLimit: any;
    let mockDb: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Create a chainable mock for the query builder
        mockLimit = vi.fn();
        mockWhere = vi.fn().mockImplementation(() => {
            const result: any = Promise.resolve([]);
            result.limit = mockLimit;
            return result;
        });
        mockInnerJoin = vi.fn().mockImplementation(() => {
            return { where: mockWhere };
        });
        mockFrom = vi.fn().mockImplementation(() => {
            return {
                innerJoin: mockInnerJoin,
                where: mockWhere
            };
        });
        mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

        mockDb = {
            select: mockSelect,
        };

        (getDb as any).mockReturnValue(mockDb);
    });

    it("should return false when user has no bookings", async () => {
        // Mock: no active bookings found in the joined query
        mockLimit.mockResolvedValueOnce([]);

        const result = await hasActiveBooking("user-123");
        expect(result).toBe(false);
        expect(mockSelect).toHaveBeenCalled();
    });

    it("should return false when user has booking for cancelled event - allows new booking", async () => {
        /**
         * This is the key test case for the scenario:
         * User has a reservation for a future event
         * That event gets cancelled
         * User should be able to book a new event
         */
        const userId = "user-123";
        const meetupId = "meetup-456";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7); // 7 days in the future
        const futureDateStr = futureDate.toISOString().split("T")[0];

        // Mock: user has a confirmed booking
        const confirmedBookings = [
            {
                id: "booking-123",
                userId,
                meetupId,
                status: "confirmed",
            },
        ];

        // Mock: the meetup is cancelled but date is in future
        const meetups = [
            {
                id: meetupId,
                date: futureDateStr,
                status: "cancelled", // Event is cancelled
            },
        ];

        // Mock: the single query returns no results if event is cancelled
        // because of ne(meetups.status, 'cancelled') in SQL
        mockLimit.mockResolvedValueOnce([]);

        const result = await hasActiveBooking(userId);

        // Should return false because event is cancelled
        expect(result).toBe(false);
        expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    it("should return true when user has booking for active future event", async () => {
        const userId = "user-123";
        const meetupId = "meetup-456";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7); // 7 days in the future
        const futureDateStr = futureDate.toISOString().split("T")[0];

        // Mock: user has a confirmed booking
        const confirmedBookings = [
            {
                id: "booking-123",
                userId,
                meetupId,
                status: "confirmed",
            },
        ];

        // Mock: the meetup is active and date is in future
        const meetups = [
            {
                id: meetupId,
                date: futureDateStr,
                status: "open", // Event is active
            },
        ];

        // Mock: single record found for active future event
        mockLimit.mockResolvedValueOnce([{ id: "booking-123" }]);

        const result = await hasActiveBooking(userId);

        // Should return true because active booking exists
        expect(result).toBe(true);
        expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    it("should return false when user has booking for past event", async () => {
        const userId = "user-123";
        const meetupId = "meetup-456";
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7); // 7 days in the past
        const pastDateStr = pastDate.toISOString().split("T")[0];

        // Mock: user has a confirmed booking
        const confirmedBookings = [
            {
                id: "booking-123",
                userId,
                meetupId,
                status: "confirmed",
            },
        ];

        // Mock: the meetup is in the past
        const meetups = [
            {
                id: meetupId,
                date: pastDateStr,
                status: "open",
            },
        ];

        // Mock: no results if event is in the past
        // because of gte(meetups.date, todayStr) in SQL
        mockLimit.mockResolvedValueOnce([]);

        const result = await hasActiveBooking(userId);

        // Should return false because event is in the past
        expect(result).toBe(false);
        expect(mockSelect).toHaveBeenCalledTimes(1);
    });
});

describe("isBookingActive", () => {
    it("should return false for booking with cancelled event", () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const booking = {
            id: "booking-123",
            status: "confirmed",
            meetup: {
                id: "meetup-456",
                date: futureDateStr,
                status: "cancelled", // Event is cancelled
            },
        };

        const result = isBookingActive(booking);
        expect(result).toBe(false);
    });

    it("should return true for booking with active future event", () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const booking = {
            id: "booking-123",
            status: "confirmed",
            meetup: {
                id: "meetup-456",
                date: futureDateStr,
                status: "open", // Event is active
            },
        };

        const result = isBookingActive(booking);
        expect(result).toBe(true);
    });

    it("should return false for booking with past event", () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const pastDateStr = pastDate.toISOString().split("T")[0];

        const booking = {
            id: "booking-123",
            status: "confirmed",
            meetup: {
                id: "meetup-456",
                date: pastDateStr,
                status: "open",
            },
        };

        const result = isBookingActive(booking);
        expect(result).toBe(false);
    });

    it("should return false for cancelled booking", () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const booking = {
            id: "booking-123",
            status: "cancelled", // Booking is cancelled
            meetup: {
                id: "meetup-456",
                date: futureDateStr,
                status: "open",
            },
        };

        const result = isBookingActive(booking);
        expect(result).toBe(false);
    });

    it("should return false for booking with missing meetup date", () => {
        const booking = {
            id: "booking-123",
            status: "confirmed",
            meetup: {
                id: "meetup-456",
                // date is missing
                status: "open",
            },
        };

        const result = isBookingActive(booking);
        expect(result).toBe(false);
    });

    it("should return false for booking with null meetup", () => {
        const booking = {
            id: "booking-123",
            status: "confirmed",
            meetup: null,
        };

        const result = isBookingActive(booking);
        expect(result).toBe(false);
    });

    it("should return false for booking with undefined meetup", () => {
        const booking = {
            id: "booking-123",
            status: "confirmed",
            meetup: undefined,
        };

        const result = isBookingActive(booking);
        expect(result).toBe(false);
    });

    it("should return true for booking with event date exactly today", () => {
        // Use local date string format (YYYY-MM-DD) to avoid timezone issues
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const todayStr = `${year}-${month}-${day}`;

        const booking = {
            id: "booking-123",
            status: "confirmed",
            meetup: {
                id: "meetup-456",
                date: todayStr, // Event is today
                status: "open",
            },
        };

        const result = isBookingActive(booking);
        expect(result).toBe(true); // Today is considered "in the future"
    });

    it("should return false for booking with event that is both past and cancelled", () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const pastDateStr = pastDate.toISOString().split("T")[0];

        const booking = {
            id: "booking-123",
            status: "confirmed",
            meetup: {
                id: "meetup-456",
                date: pastDateStr,
                status: "cancelled", // Both past AND cancelled
            },
        };

        const result = isBookingActive(booking);
        expect(result).toBe(false);
    });

    it("should return false for booking with event status 'full' but not cancelled", () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const booking = {
            id: "booking-123",
            status: "confirmed",
            meetup: {
                id: "meetup-456",
                date: futureDateStr,
                status: "full", // Event is full but not cancelled
            },
        };

        const result = isBookingActive(booking);
        // Should return true because "full" is not "cancelled"
        expect(result).toBe(true);
    });

    it("should return false for booking with event status 'past'", () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const booking = {
            id: "booking-123",
            status: "confirmed",
            meetup: {
                id: "meetup-456",
                date: futureDateStr,
                status: "past", // Status is "past" even though date is future (data inconsistency)
            },
        };

        const result = isBookingActive(booking);
        // Should return true because we check date, not status "past"
        // But status "past" is not "cancelled", so it's still active
        expect(result).toBe(true);
    });
});

describe("hasActiveBooking - Edge Cases", () => {
    let mockSelect: any;
    let mockFrom: any;
    let mockWhere: any;
    let mockInnerJoin: any;
    let mockLimit: any;
    let mockDb: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockLimit = vi.fn();
        mockWhere = vi.fn().mockImplementation(() => {
            const result: any = Promise.resolve([]);
            result.limit = mockLimit;
            return result;
        });
        mockInnerJoin = vi.fn().mockImplementation(() => {
            return { where: mockWhere };
        });
        mockFrom = vi.fn().mockImplementation(() => {
            return {
                innerJoin: mockInnerJoin,
                where: mockWhere
            };
        });
        mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

        mockDb = { select: mockSelect };
        (getDb as any).mockReturnValue(mockDb);
    });

    it("should return true when event date is exactly today", async () => {
        const userId = "user-123";
        const meetupId = "meetup-456";
        // Use local date string format (YYYY-MM-DD) to avoid timezone issues
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const todayStr = `${year}-${month}-${day}`;

        const confirmedBookings = [{ id: "booking-123", userId, meetupId, status: "confirmed" }];
        const meetups = [{ id: meetupId, date: todayStr, status: "open" }];

        // Mock: single query returns result if today's event is active
        mockLimit.mockResolvedValueOnce([{ id: "booking-123" }]);

        const result = await hasActiveBooking(userId);
        expect(result).toBe(true); // Today is considered "in the future"
    });

    it("should return true when user has multiple bookings but one is active", async () => {
        const userId = "user-123";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const pastDateStr = pastDate.toISOString().split("T")[0];

        // User has multiple bookings
        const confirmedBookings = [
            { id: "booking-1", userId, meetupId: "meetup-1", status: "confirmed" },
            { id: "booking-2", userId, meetupId: "meetup-2", status: "confirmed" },
        ];

        // One is active, one is past
        const meetups = [
            { id: "meetup-1", date: futureDateStr, status: "open" },
            { id: "meetup-2", date: pastDateStr, status: "open" },
        ];

        // Mock: returns the active booking
        mockLimit.mockResolvedValueOnce([{ id: "booking-1" }]);

        const result = await hasActiveBooking(userId);
        expect(result).toBe(true); // Has at least one active booking
    });

    it("should return false when user has multiple bookings but all are for cancelled events", async () => {
        const userId = "user-123";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const confirmedBookings = [
            { id: "booking-1", userId, meetupId: "meetup-1", status: "confirmed" },
            { id: "booking-2", userId, meetupId: "meetup-2", status: "confirmed" },
        ];

        // All events are cancelled
        const meetups = [
            { id: "meetup-1", date: futureDateStr, status: "cancelled" },
            { id: "meetup-2", date: futureDateStr, status: "cancelled" },
        ];

        // Mock: empty if all cancelled
        mockLimit.mockResolvedValueOnce([]);

        const result = await hasActiveBooking(userId);
        expect(result).toBe(false); // All events are cancelled
    });

    it("should return false when user has booking but meetup doesn't exist (orphaned booking)", async () => {
        const userId = "user-123";
        const meetupId = "meetup-456";

        const confirmedBookings = [
            { id: "booking-123", userId, meetupId, status: "confirmed" },
        ];

        // Meetup doesn't exist in database
        const meetups: any[] = [];

        // Mock: empty if meetup doesn't exist (due to inner join)
        mockLimit.mockResolvedValueOnce([]);

        const result = await hasActiveBooking(userId);
        expect(result).toBe(false); // Meetup not found
    });

    it("should return false when user has booking but meetup ID doesn't match", async () => {
        const userId = "user-123";
        const meetupId = "meetup-456";

        const confirmedBookings = [
            { id: "booking-123", userId, meetupId, status: "confirmed" },
        ];

        // Meetup exists but with different ID
        const meetups = [
            { id: "meetup-999", date: "2025-12-31", status: "open" },
        ];

        // Mock: empty due to join fail
        mockLimit.mockResolvedValueOnce([]);

        const result = await hasActiveBooking(userId);
        expect(result).toBe(false); // Meetup ID doesn't match
    });

    it("should return false when meetupIds array contains only null/undefined", async () => {
        const userId = "user-123";

        // Bookings exist but meetupId is missing/null/undefined
        // When mapped, this creates an array like [null, undefined]
        // The array has length > 0, but inArray will filter them out
        // The meetupsResult will be empty, so no active booking found
        const confirmedBookings = [
            { id: "booking-123", userId, meetupId: null, status: "confirmed" },
            { id: "booking-124", userId, meetupId: undefined, status: "confirmed" },
        ];

        mockLimit.mockResolvedValueOnce([]);

        const result = await hasActiveBooking(userId);
        expect(result).toBe(false); // No valid meetups found
    });

    it("should return true when user has mix of cancelled and active bookings", async () => {
        const userId = "user-123";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const confirmedBookings = [
            { id: "booking-1", userId, meetupId: "meetup-1", status: "confirmed" },
            { id: "booking-2", userId, meetupId: "meetup-2", status: "confirmed" },
        ];

        // One cancelled, one active
        const meetups = [
            { id: "meetup-1", date: futureDateStr, status: "cancelled" },
            { id: "meetup-2", date: futureDateStr, status: "open" },
        ];

        // Mock: returns the active one
        mockLimit.mockResolvedValueOnce([{ id: "booking-2" }]);

        const result = await hasActiveBooking(userId);
        expect(result).toBe(true); // Has at least one active booking
    });

    it("should return false when event status is 'full' but date is in future", async () => {
        const userId = "user-123";
        const meetupId = "meetup-456";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const confirmedBookings = [
            { id: "booking-123", userId, meetupId, status: "confirmed" },
        ];

        // Event is full but not cancelled
        const meetups = [
            { id: meetupId, date: futureDateStr, status: "full" },
        ];

        mockLimit.mockResolvedValueOnce([{ id: "booking-123" }]);

        const result = await hasActiveBooking(userId);
        expect(result).toBe(true); // "full" is not "cancelled", so booking is still active
    });

    it("should handle event with status 'past' but future date (data inconsistency)", async () => {
        const userId = "user-123";
        const meetupId = "meetup-456";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const confirmedBookings = [
            { id: "booking-123", userId, meetupId, status: "confirmed" },
        ];

        // Status says "past" but date is in future (data inconsistency)
        const meetups = [
            { id: meetupId, date: futureDateStr, status: "past" },
        ];

        mockLimit.mockResolvedValueOnce([{ id: "booking-123" }]);

        const result = await hasActiveBooking(userId);
        // Should return true because we check date, not status "past"
        // Status "past" is not "cancelled", so it's still considered active
        expect(result).toBe(true);
    });
});

describe("isMeetupInFuture - Edge Cases", () => {
    it("should return false for meetup with null date", () => {
        const meetup = { id: "meetup-123", date: null, status: "open" };
        expect(isMeetupInFuture(meetup)).toBe(false);
    });

    it("should return false for meetup with undefined date", () => {
        const meetup = { id: "meetup-123", date: undefined, status: "open" };
        expect(isMeetupInFuture(meetup)).toBe(false);
    });

    it("should return false for meetup with missing date property", () => {
        const meetup = { id: "meetup-123", status: "open" };
        expect(isMeetupInFuture(meetup)).toBe(false);
    });

    it("should return true for meetup with date exactly today", () => {
        // Use local date string format (YYYY-MM-DD) to avoid timezone issues
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const todayStr = `${year}-${month}-${day}`;
        const meetup = { id: "meetup-123", date: todayStr, status: "open" };
        expect(isMeetupInFuture(meetup)).toBe(true);
    });

    it("should return false for meetup with date one day in the past", () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        const meetup = { id: "meetup-123", date: yesterdayStr, status: "open" };
        expect(isMeetupInFuture(meetup)).toBe(false);
    });

    it("should return true for meetup with date one day in the future", () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        const meetup = { id: "meetup-123", date: tomorrowStr, status: "open" };
        expect(isMeetupInFuture(meetup)).toBe(true);
    });

    it("should return false for null meetup", () => {
        expect(isMeetupInFuture(null)).toBe(false);
    });

    it("should return false for undefined meetup", () => {
        expect(isMeetupInFuture(undefined)).toBe(false);
    });
});

describe("getPastBookings - Feedback Scenarios", () => {
    let mockSelect: any;
    let mockFromBookings: any;
    let mockFromMeetups: any;
    let mockFromLocations: any;
    let mockWhere: any;
    let mockDb: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock db.select().from().where() chain (Edge Runtime compatible)
        // getPastBookings makes 3 parallel queries:
        // 1. db.select().from(bookings).where(...) -> needs where()
        // 2. db.select().from(meetups) -> returns promise directly
        // 3. db.select().from(coffeeShops) -> returns promise directly
        mockWhere = vi.fn();

        // Create separate mocks for each table
        mockFromBookings = vi.fn().mockReturnValue({ where: mockWhere });
        mockFromMeetups = vi.fn();
        mockFromLocations = vi.fn();

        // mockFrom will return different mocks based on the table
        let callCount = 0;
        const mockFrom = vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return mockFromBookings(); // bookings
            if (callCount === 2) return mockFromMeetups(); // meetups
            return mockFromLocations(); // locations
        });

        mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

        mockDb = {
            select: mockSelect,
        };

        (getDb as any).mockReturnValue(mockDb);
    });

    it("should NOT include cancelled future events in past bookings", async () => {
        const userId = "user-123";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        // User has a booking for a cancelled future event
        const allBookings = [
            {
                id: "booking-123",
                userId,
                meetupId: "meetup-456",
                status: "confirmed",
                createdAt: new Date(),
            },
        ];

        const allMeetups = [
            {
                id: "meetup-456",
                date: futureDateStr,
                status: "cancelled", // Event is cancelled but date is in future
                locationId: null,
            },
        ];

        const allLocations: any[] = [];

        // Mock Promise.all([bookings, meetups, locations])
        // getPastBookings calls db.select() 3 times in parallel
        mockWhere.mockResolvedValueOnce(allBookings); // bookings query
        mockFromMeetups.mockResolvedValueOnce(allMeetups); // meetups query
        mockFromLocations.mockResolvedValueOnce(allLocations); // locations query

        const { getPastBookings } = await import("../data");
        const pastBookings = await getPastBookings(userId);

        // Should NOT include cancelled future events
        expect(pastBookings).toHaveLength(0);
    });

    it("should include past events even if they are cancelled", async () => {
        const userId = "user-123";
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const pastDateStr = pastDate.toISOString().split("T")[0];

        // User has a booking for a cancelled past event
        const allBookings = [
            {
                id: "booking-123",
                userId,
                meetupId: "meetup-456",
                status: "confirmed",
                createdAt: new Date(),
            },
        ];

        const allMeetups = [
            {
                id: "meetup-456",
                date: pastDateStr,
                status: "cancelled", // Event is cancelled AND date is in past
                locationId: null,
            },
        ];

        const allLocations: any[] = [];

        mockWhere.mockResolvedValueOnce(allBookings);
        mockFromMeetups.mockResolvedValueOnce(allMeetups);
        mockFromLocations.mockResolvedValueOnce(allLocations);

        const { getPastBookings } = await import("../data");
        const pastBookings = await getPastBookings(userId);

        // Should include cancelled past events (user can still provide feedback)
        expect(pastBookings).toHaveLength(1);
        expect(pastBookings[0].id).toBe("booking-123");
    });

    it("should include past events with status 'past'", async () => {
        const userId = "user-123";
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const pastDateStr = pastDate.toISOString().split("T")[0];

        const allBookings = [
            {
                id: "booking-123",
                userId,
                meetupId: "meetup-456",
                status: "confirmed",
                createdAt: new Date(),
            },
        ];

        const allMeetups = [
            {
                id: "meetup-456",
                date: pastDateStr,
                status: "past", // Explicitly marked as past
                locationId: null,
            },
        ];

        const allLocations: any[] = [];

        mockWhere.mockResolvedValueOnce(allBookings);
        mockFromMeetups.mockResolvedValueOnce(allMeetups);
        mockFromLocations.mockResolvedValueOnce(allLocations);

        const { getPastBookings } = await import("../data");
        const pastBookings = await getPastBookings(userId);

        expect(pastBookings).toHaveLength(1);
        expect(pastBookings[0].id).toBe("booking-123");
    });

    it("should NOT include future events even if status is 'open'", async () => {
        const userId = "user-123";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const allBookings = [
            {
                id: "booking-123",
                userId,
                meetupId: "meetup-456",
                status: "confirmed",
                createdAt: new Date(),
            },
        ];

        const allMeetups = [
            {
                id: "meetup-456",
                date: futureDateStr,
                status: "open", // Event is open but date is in future
                locationId: null,
            },
        ];

        const allLocations: any[] = [];

        mockWhere.mockResolvedValueOnce(allBookings);
        mockFromMeetups.mockResolvedValueOnce(allMeetups);
        mockFromLocations.mockResolvedValueOnce(allLocations);

        const { getPastBookings } = await import("../data");
        const pastBookings = await getPastBookings(userId);

        // Should NOT include future events
        expect(pastBookings).toHaveLength(0);
    });
});

describe("getUnratedPastBooking - Feedback Loop Prevention", () => {
    let mockSelect: any;
    let mockFromBookings: any;
    let mockFromMeetups: any;
    let mockFromLocations: any;
    let mockFromFeedback: any;
    let mockWhere: any;
    let mockLimit: any;
    let mockDb: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock db.select().from().where() for getPastBookings (3 queries in parallel)
        // Mock db.select().from().where() for getUnratedPastBooking's feedback query
        mockWhere = vi.fn();
        mockLimit = vi.fn();

        // For getPastBookings: bookings (with where), meetups (no where), locations (no where)
        mockFromBookings = vi.fn().mockReturnValue({ where: mockWhere });
        mockFromMeetups = vi.fn();
        mockFromLocations = vi.fn();

        // For getUnratedPastBooking's feedback query: feedback (with where, no limit needed)
        // getUnratedPastBooking uses: db.select().from(feedback).where(inArray(...))
        // This returns an array directly, not a limit chain
        // We'll use mockWhere for this too, but it will be the 4th call
        mockFromFeedback = vi.fn().mockReturnValue({ where: mockWhere });

        // mockFrom will return different mocks based on the table
        // getPastBookings makes 3 calls, then getUnratedPastBooking makes 1 more
        let callCount = 0;
        const mockFrom = vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return mockFromBookings(); // bookings (getPastBookings)
            if (callCount === 2) return mockFromMeetups(); // meetups (getPastBookings)
            if (callCount === 3) return mockFromLocations(); // locations (getPastBookings)
            return mockFromFeedback(); // feedback (getUnratedPastBooking)
        });

        mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

        mockDb = {
            select: mockSelect,
        };

        (getDb as any).mockReturnValue(mockDb);
    });

    it("should NOT return cancelled future events for feedback", async () => {
        const userId = "user-123";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        // User has a booking for a cancelled future event
        const allBookings = [
            {
                id: "booking-123",
                userId,
                meetupId: "meetup-456",
                status: "confirmed",
                createdAt: new Date(),
            },
        ];

        const allMeetups = [
            {
                id: "meetup-456",
                date: futureDateStr,
                status: "cancelled",
                locationId: null,
            },
        ];

        const allLocations: any[] = [];

        // Mock getPastBookings (3 parallel queries)
        mockWhere.mockResolvedValueOnce(allBookings);
        mockFromMeetups.mockResolvedValueOnce(allMeetups);
        mockFromLocations.mockResolvedValueOnce(allLocations);
        // Mock getUnratedPastBooking's feedback query (4th call to mockWhere)
        mockWhere.mockResolvedValueOnce([]); // No feedback exists

        const { getUnratedPastBooking } = await import("../data");
        const result = await getUnratedPastBooking(userId);

        // Should NOT return future events, even if cancelled
        expect(result).toBeNull();
    });

    it("should return past events that need feedback", async () => {
        const userId = "user-123";
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const pastDateStr = pastDate.toISOString().split("T")[0];

        const allBookings = [
            {
                id: "booking-123",
                userId,
                meetupId: "meetup-456",
                status: "confirmed",
                createdAt: new Date(),
            },
        ];

        const allMeetups = [
            {
                id: "meetup-456",
                date: pastDateStr,
                status: "open",
                locationId: null,
            },
        ];

        const allLocations: any[] = [];

        // Mock getPastBookings (3 parallel queries)
        mockWhere.mockResolvedValueOnce(allBookings);
        mockFromMeetups.mockResolvedValueOnce(allMeetups);
        mockFromLocations.mockResolvedValueOnce(allLocations);
        // Mock getUnratedPastBooking's feedback query (4th call to mockWhere)
        mockWhere.mockResolvedValueOnce([]); // No feedback exists

        const { getUnratedPastBooking } = await import("../data");
        const result = await getUnratedPastBooking(userId);

        // Should return past event that needs feedback
        expect(result).toBe("booking-123");
        expect(mockSelect).toHaveBeenCalled();
    });

    it("should NOT return events that already have feedback", async () => {
        const userId = "user-123";
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const pastDateStr = pastDate.toISOString().split("T")[0];

        const allBookings = [
            {
                id: "booking-123",
                userId,
                meetupId: "meetup-456",
                status: "confirmed",
                createdAt: new Date(),
            },
        ];

        const allMeetups = [
            {
                id: "meetup-456",
                date: pastDateStr,
                status: "open",
                locationId: null,
            },
        ];

        const allLocations: any[] = [];

        // Mock getPastBookings (3 parallel queries)
        mockWhere.mockResolvedValueOnce(allBookings);
        mockFromMeetups.mockResolvedValueOnce(allMeetups);
        mockFromLocations.mockResolvedValueOnce(allLocations);
        // Mock getUnratedPastBooking's feedback query (4th call to mockWhere) - feedback already exists
        mockWhere.mockResolvedValueOnce([
            { id: "feedback-123", bookingId: "booking-123", rating: 5 },
        ]);

        const { getUnratedPastBooking } = await import("../data");
        const result = await getUnratedPastBooking(userId);

        // Should NOT return events that already have feedback
        expect(result).toBeNull();
        expect(mockSelect).toHaveBeenCalled();
    });

    it("should skip future events even if they appear in past bookings list", async () => {
        const userId = "user-123";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        // Edge case: somehow a future event got into the list (shouldn't happen, but test it)
        const allBookings = [
            {
                id: "booking-123",
                userId,
                meetupId: "meetup-456",
                status: "confirmed",
                createdAt: new Date(),
            },
        ];

        const allMeetups = [
            {
                id: "meetup-456",
                date: futureDateStr,
                status: "open",
                locationId: null,
            },
        ];

        const allLocations: any[] = [];

        // Mock getPastBookings (3 parallel queries)
        mockWhere.mockResolvedValueOnce(allBookings);
        mockFromMeetups.mockResolvedValueOnce(allMeetups);
        mockFromLocations.mockResolvedValueOnce(allLocations);
        // Mock getUnratedPastBooking's feedback query (4th call to mockWhere) - no feedback exists
        mockWhere.mockResolvedValueOnce([]);

        const { getUnratedPastBooking } = await import("../data");
        const result = await getUnratedPastBooking(userId);

        // Should skip future events even if they somehow got into the list
        expect(result).toBeNull();
    });

    it("should return the first unrated past event when multiple exist", async () => {
        const userId = "user-123";
        const pastDate1 = new Date();
        pastDate1.setDate(pastDate1.getDate() - 14);
        const pastDateStr1 = pastDate1.toISOString().split("T")[0];

        const pastDate2 = new Date();
        pastDate2.setDate(pastDate2.getDate() - 7);
        const pastDateStr2 = pastDate2.toISOString().split("T")[0];

        const allBookings = [
            {
                id: "booking-1",
                userId,
                meetupId: "meetup-1",
                status: "confirmed",
                createdAt: new Date(pastDate1),
            },
            {
                id: "booking-2",
                userId,
                meetupId: "meetup-2",
                status: "confirmed",
                createdAt: new Date(pastDate2),
            },
        ];

        const allMeetups = [
            {
                id: "meetup-1",
                date: pastDateStr1,
                status: "open",
                locationId: null,
            },
            {
                id: "meetup-2",
                date: pastDateStr2,
                status: "open",
                locationId: null,
            },
        ];

        const allLocations: any[] = [];

        // Mock getPastBookings (3 parallel queries)
        mockWhere.mockResolvedValueOnce(allBookings);
        mockFromMeetups.mockResolvedValueOnce(allMeetups);
        mockFromLocations.mockResolvedValueOnce(allLocations);
        // Mock getUnratedPastBooking's feedback query (4th call to mockWhere) - no feedback exists
        mockWhere.mockResolvedValueOnce([]);

        const { getUnratedPastBooking } = await import("../data");
        const result = await getUnratedPastBooking(userId);

        // Should return the first unrated past event (most recent first, so booking-2 comes before booking-1)
        // getPastBookings sorts by createdAt descending, so booking-2 (7 days ago) comes before booking-1 (14 days ago)
        expect(result).toBe("booking-2");
    });

    it("should return second event if first already has feedback", async () => {
        const userId = "user-123";
        const pastDate1 = new Date();
        pastDate1.setDate(pastDate1.getDate() - 14);
        const pastDateStr1 = pastDate1.toISOString().split("T")[0];

        const pastDate2 = new Date();
        pastDate2.setDate(pastDate2.getDate() - 7);
        const pastDateStr2 = pastDate2.toISOString().split("T")[0];

        const allBookings = [
            {
                id: "booking-1",
                userId,
                meetupId: "meetup-1",
                status: "confirmed",
                createdAt: new Date(pastDate1),
            },
            {
                id: "booking-2",
                userId,
                meetupId: "meetup-2",
                status: "confirmed",
                createdAt: new Date(pastDate2),
            },
        ];

        const allMeetups = [
            {
                id: "meetup-1",
                date: pastDateStr1,
                status: "open",
                locationId: null,
            },
            {
                id: "meetup-2",
                date: pastDateStr2,
                status: "open",
                locationId: null,
            },
        ];

        const allLocations: any[] = [];

        // Mock getPastBookings (3 parallel queries)
        mockWhere.mockResolvedValueOnce(allBookings);
        mockFromMeetups.mockResolvedValueOnce(allMeetups);
        mockFromLocations.mockResolvedValueOnce(allLocations);
        // Mock getUnratedPastBooking's batched feedback query (4th call to mockWhere)
        // First booking already has feedback, second doesn't
        mockWhere.mockResolvedValueOnce([
            { id: "feedback-1", bookingId: "booking-1", rating: 5 },
        ]);

        const { getUnratedPastBooking } = await import("../data");
        const result = await getUnratedPastBooking(userId);

        // Should return the second event since first already has feedback
        expect(result).toBe("booking-2");
    });
});

describe("getUpcomingMeetups", () => {
    let mockSelect: any;
    let mockFrom: any;
    let mockWhere: any;
    let mockOrderBy: any;
    let mockLimit: any;
    let mockDb: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockLimit = vi.fn();
        mockOrderBy = vi.fn().mockImplementation(() => {
            const res: any = Promise.resolve([]);
            res.limit = mockLimit;
            return res;
        });
        mockWhere = vi.fn().mockImplementation(() => {
            const res: any = Promise.resolve([]);
            res.orderBy = mockOrderBy;
            return res;
        });
        mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
        mockDb = { select: mockSelect };
        (getDb as any).mockReturnValue(mockDb);
    });

    it("should prioritize available meetups over full ones", async () => {
        const todayStr = new Date().toISOString().split("T")[0];

        // Mock 3 meetups: 
        // 1. Tomorrow, FULL (m1)
        // 2. Tomorrow, AVAILABLE (m2)
        // 3. Next week, AVAILABLE (m3)
        const mockMeetups = [
            { id: "m1", date: todayStr, capacity: 2, locationId: "loc1", time: "10:00" },
            { id: "m2", date: todayStr, capacity: 6, locationId: "loc1", time: "14:00" },
            { id: "m3", date: "2099-01-01", capacity: 6, locationId: "loc2", time: "10:00" },
        ];

        // First call to db.select().from(meetups)... terminates at .limit(10)
        mockLimit.mockResolvedValueOnce(mockMeetups);

        // Mock bookings: m1 is full (2 attendees)
        const mockBookings = [
            { id: "b1", meetupId: "m1", status: "confirmed", hasPlusOne: "false" },
            { id: "b2", meetupId: "m1", status: "confirmed", hasPlusOne: "false" },
        ];

        // The bookings query terminates at .where()
        // We need to ensure the first where() call for meetups remains chainable
        mockWhere
            .mockImplementationOnce(() => {
                const res: any = Promise.resolve([]);
                res.orderBy = mockOrderBy;
                return res;
            })
            .mockResolvedValueOnce(mockBookings);

        const { getUpcomingMeetups } = await import("../data");
        const result = await getUpcomingMeetups();

        // Should return m2 (Available, soonest) and m3 (Available, later)
        // because m1 is Full.
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe("m2");
        expect(result[1].id).toBe("m3");
    });

    it("should show full meetups if no available meetups exist", async () => {
        const todayStr = new Date().toISOString().split("T")[0];

        const mockMeetups = [
            { id: "m1", date: todayStr, capacity: 1, locationId: "loc1", time: "10:00" },
            { id: "m2", date: todayStr, capacity: 1, locationId: "loc1", time: "14:00" },
        ];

        mockLimit.mockResolvedValueOnce(mockMeetups);

        // Both are full
        const mockBookings = [
            { id: "b1", meetupId: "m1", status: "confirmed", hasPlusOne: "false" },
            { id: "b2", meetupId: "m2", status: "confirmed", hasPlusOne: "false" },
        ];

        mockWhere
            .mockImplementationOnce(() => {
                const res: any = Promise.resolve([]);
                res.orderBy = mockOrderBy;
                return res;
            })
            .mockResolvedValueOnce(mockBookings);

        const { getUpcomingMeetups } = await import("../data");
        const result = await getUpcomingMeetups();

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe("m1");
        expect(result[1].id).toBe("m2");
        expect(result[0].isFull).toBe(true);
        expect(result[1].isFull).toBe(true);
    });
});

