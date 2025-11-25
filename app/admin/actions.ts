"use server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { users, meetups, coffeeShops, bookings } from "@/lib/schema";
import { eq } from "drizzle-orm";
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

    if (!date || !time || !locationId || !language) {
        throw new Error("Missing required fields");
    }

    const db = getDb();
    await db.insert(meetups).values({
        id: crypto.randomUUID(),
        date,
        time,
        locationId,
        language,
        status: "open",
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

    if (!id || !date || !time || !locationId || !language || !status) {
        throw new Error("Missing required fields");
    }

    const db = getDb();
    await db.update(meetups).set({
        date,
        time,
        locationId,
        language,
        status,
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

    // Get booking details before update for email
    const booking = await db.query.bookings.findFirst({
        where: (bookings, { eq }) => eq(bookings.id, bookingId),
        with: {
            user: true,
            meetup: {
                with: {
                    location: true,
                },
            },
        },
    });

    await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, bookingId));

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
}
