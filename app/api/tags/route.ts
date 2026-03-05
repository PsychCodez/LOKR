import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tags — list all tags for authenticated user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
        where: { userId: session.user.id },
        include: {
            _count: { select: { credentials: true } },
        },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(
        tags.map((t) => ({
            id: t.id,
            name: t.name,
            count: t._count.credentials,
        }))
    );
}
