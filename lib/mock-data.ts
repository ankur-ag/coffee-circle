export interface CoffeeShop {
    id: string;
    name: string;
    location: string;
    description: string;
    image: string;
    rating: number;
    features: string[];
}

export interface User {
    id: string;
    name: string;
    avatar: string;
    bio: string;
}

export interface Meetup {
    id: string;
    date: string; // ISO string
    time: string;
    location?: CoffeeShop; // Revealed later
    attendees: User[];
    status: "open" | "full" | "past";
}

export const COFFEE_SHOPS: CoffeeShop[] = [
    {
        id: "1",
        name: "Simple Kaffa",
        location: "Zhongzheng District, Taipei",
        description: "World-renowned coffee shop known for its championship-winning baristas and minimalist industrial design.",
        image: "/images/coffee_shop_modern_1763804664351.png",
        rating: 4.9,
        features: ["Specialty Coffee", "Quiet", "WiFi"],
    },
    {
        id: "2",
        name: "Fika Fika Cafe",
        location: "Zhongshan District, Taipei",
        description: "Nordic-style cafe offering a cozy atmosphere and exceptional single-origin beans.",
        image: "/images/coffee_shop_cozy_1763804682580.png",
        rating: 4.8,
        features: ["Cozy", "Pastries", "Bright"],
    },
    {
        id: "3",
        name: "The Lobby of Simple Kaffa",
        location: "Songshan District, Taipei",
        description: "A spacious venue perfect for group conversations with a view of the city.",
        image: "/images/coffee_shop_modern_1763804664351.png", // Reusing for now
        rating: 4.7,
        features: [" spacious", "City View", "Groups"],
    },
];

export const USERS: User[] = [
    {
        id: "u1",
        name: "Sarah Chen",
        avatar: "/images/avatar_sarah_1763804701359.png",
        bio: "Digital Nomad & Designer",
    },
    {
        id: "u2",
        name: "David Lin",
        avatar: "/images/avatar_david_1763804717491.png",
        bio: "Software Engineer",
    },
    {
        id: "u3",
        name: "Emily Wang",
        avatar: "/images/avatar_sarah_1763804701359.png", // Reusing
        bio: "Marketing Specialist",
    },
    {
        id: "u4",
        name: "Michael Chang",
        avatar: "/images/avatar_david_1763804717491.png", // Reusing
        bio: "Architect",
    },
];

// Helper to get next Saturday and Sunday
const getNextWeekend = () => {
    const today = new Date();
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7));

    const nextSunday = new Date(nextSaturday);
    nextSunday.setDate(nextSaturday.getDate() + 1);

    return { saturday: nextSaturday, sunday: nextSunday };
};

const { saturday, sunday } = getNextWeekend();

export const UPCOMING_MEETUPS: Meetup[] = [
    {
        id: "m1",
        date: saturday.toISOString().split('T')[0],
        time: "14:00",
        status: "open",
        attendees: [USERS[0], USERS[1]],
    },
    {
        id: "m2",
        date: sunday.toISOString().split('T')[0],
        time: "14:00",
        status: "open",
        attendees: [USERS[2]],
    },
];
