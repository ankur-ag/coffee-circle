"use server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { users, meetups, coffeeShops, bookings } from "@/lib/schema";
import { eq, and, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateUserRole(formData: FormData) {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const userId = formData.get("userId") as string;
    const role = formData.get("role") as string;

    if (!userId || !role) {
        throw new Error("Missing required fields");
    }

    const db = getDb();
    await db.update(users).set({ role }).where(eq(users.id, userId));

    revalidatePath("/admin/users");
}

export async function createMeetup(formData: FormData) {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const locationId = formData.get("locationId") as string;
    const language = formData.get("language") as string;
    const capacityStr = formData.get("capacity") as string;
    const capacity = capacityStr ? parseInt(capacityStr, 10) : 6;

    if (!date || !time || !locationId || !language) {
        throw new Error("Missing required fields");
    }

    if (isNaN(capacity) || capacity < 1) {
        throw new Error("Capacity must be a positive number");
    }

    const db = getDb();

    // Check for existing meetups at the same location and date
    const existingMeetups = await db
        .select({ count: count() })
        .from(meetups)
        .where(and(
            eq(meetups.locationId, locationId),
            eq(meetups.date, date)
        ));

    console.log("Existing meetups count:", existingMeetups[0].count);

    const nextTableNumber = existingMeetups[0].count + 1;
    const tableName = `Table ${nextTableNumber}`;

    await db.insert(meetups).values({
        id: crypto.randomUUID(),
        date,
        time,
        locationId,
        language,
        status: "open",
        capacity,
        tableName,
    });

    revalidatePath("/admin/events");
    redirect("/admin/events");
}

export async function updateMeetup(formData: FormData) {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const id = formData.get("id") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const locationId = formData.get("locationId") as string;
    const language = formData.get("language") as string;
    const status = formData.get("status") as string;
    const tableName = formData.get("tableName") as string;
    const capacityStr = formData.get("capacity") as string;
    const capacity = capacityStr ? parseInt(capacityStr, 10) : 6;

    if (!id || !date || !time || !locationId || !language || !status) {
        throw new Error("Missing required fields");
    }

    if (isNaN(capacity) || capacity < 1) {
        throw new Error("Capacity must be a positive number");
    }

    const db = getDb();
    await db.update(meetups).set({
        date,
        time,
        locationId,
        language,
        status,
        capacity,
        tableName: tableName || "Table 1",
    }).where(eq(meetups.id, id));

    revalidatePath("/admin/events");
    revalidatePath("/book");
    redirect("/admin/events");
}

export async function createCoffeeShop(formData: FormData) {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const location = formData.get("location") as string;
    const city = formData.get("city") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as string;
    const rating = parseInt(formData.get("rating") as string);
    const features = formData.get("features") as string;
    const googleMapsLink = formData.get("googleMapsLink") as string | null;

    if (!name || !location || !city || !description || !image || !rating || !features) {
        throw new Error("Missing required fields");
    }

    const db = getDb();
    await db.insert(coffeeShops).values({
        id: crypto.randomUUID(),
        name,
        location,
        city,
        description,
        image,
        rating,
        features,
        googleMapsLink: googleMapsLink || null,
    });

    revalidatePath("/admin/locations");
    redirect("/admin/locations");
}

export async function updateCoffeeShop(formData: FormData) {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const location = formData.get("location") as string;
    const city = formData.get("city") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as string;
    const rating = parseInt(formData.get("rating") as string);
    const features = formData.get("features") as string;
    const googleMapsLink = formData.get("googleMapsLink") as string | null;

    if (!id || !name || !location || !city || !description || !image || !rating || !features) {
        throw new Error("Missing required fields");
    }

    const db = getDb();
    await db.update(coffeeShops).set({
        name,
        location,
        city,
        description,
        image,
        rating,
        features,
        googleMapsLink: googleMapsLink || null,
    }).where(eq(coffeeShops.id, id));

    revalidatePath("/admin/locations");
    redirect("/admin/locations");
}

export async function cancelBookingAdmin(bookingId: string) {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const db = getDb();

    // Get booking details before update for email (Edge Runtime compatible)
    const [bookingResult] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1) as any[];

    if (!bookingResult) {
        throw new Error("Booking not found");
    }

    // Fetch related data in parallel
    const [userResult, meetupResult] = await Promise.all([
        bookingResult.userId
            ? db
                .select()
                .from(users)
                .where(eq(users.id, bookingResult.userId))
                .limit(1)
            : Promise.resolve([]),
        bookingResult.meetupId
            ? db
                .select()
                .from(meetups)
                .where(eq(meetups.id, bookingResult.meetupId))
                .limit(1)
            : Promise.resolve([]),
    ]) as [any[], any[]];

    const user = userResult.length > 0 ? userResult[0] : null;
    const meetup = meetupResult.length > 0 ? meetupResult[0] : null;

    // Get location if meetup has one
    let location = null;
    if (meetup?.locationId) {
        const [locationResult] = await db
            .select()
            .from(coffeeShops)
            .where(eq(coffeeShops.id, meetup.locationId))
            .limit(1) as any[];
        location = locationResult || null;
    }

    // Combine into booking object
    const booking = {
        ...bookingResult,
        user,
        meetup: meetup ? { ...meetup, location } : null,
    };

    // Note: When a booking with +1 is cancelled, the headcount automatically decreases by 2
    // because the capacity counting only includes confirmed bookings
    const hadPlusOne = booking?.hasPlusOne === "true";

    // Update booking status to cancelled
    await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, bookingId));

    console.log(`Booking cancelled by admin${hadPlusOne ? " (with +1, reducing headcount by 2)" : ""}`);

    // Send cancellation email to user (non-blocking)
    if (booking?.user?.email && booking?.user?.name) {
        try {
            const { sendCancellationConfirmation } = await import("@/lib/email");
            await sendCancellationConfirmation({
                to: booking.user.email,
                userName: booking.user.name,
                eventDate: booking.meetup?.date || "TBD",
                eventTime: booking.meetup?.time || "TBD",
                locationName: booking.meetup?.location?.name || "TBD",
                locationCity: booking.meetup?.location?.city || "TBD",
            });
        } catch (emailError) {
            console.error("Failed to send admin cancellation email:", emailError);
        }
    }

    revalidatePath("/admin/bookings");
    revalidatePath("/book"); // Revalidate to update capacity display
}
