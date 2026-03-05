import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

// GET /api/credentials — list credentials (with optional search & tag filter)
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const tag = searchParams.get("tag")?.trim() || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId: session.user.id };

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { url: { contains: search, mode: "insensitive" } },
        ];
    }

    if (tag) {
        where.tags = {
            some: { name: { equals: tag, mode: "insensitive" } },
        };
    }

    const credentials = await prisma.credential.findMany({
        where,
        include: { tags: { select: { id: true, name: true } } },
        orderBy: { updatedAt: "desc" },
    });

    // Return credentials with masked passwords
    const result = credentials.map((c) => ({
        id: c.id,
        name: c.name,
        username: c.username,
        url: c.url,
        notes: c.notes,
        tags: c.tags,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
    }));

    return NextResponse.json(result);
}

// POST /api/credentials — create a new credential
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, username, password, url, notes, tags } = body;

    if (!name || !username || !password) {
        return NextResponse.json(
            { error: "Name, username, and password are required" },
            { status: 400 }
        );
    }

    const encryptedPassword = encrypt(password);

    // Process tags — find or create
    const tagConnections = [];
    if (tags && Array.isArray(tags)) {
        for (const tagName of tags) {
            const trimmed = tagName.trim();
            if (!trimmed) continue;
            const existingTag = await prisma.tag.findUnique({
                where: {
                    name_userId: { name: trimmed.toLowerCase(), userId: session.user.id },
                },
            });
            if (existingTag) {
                tagConnections.push({ id: existingTag.id });
            } else {
                const newTag = await prisma.tag.create({
                    data: { name: trimmed.toLowerCase(), userId: session.user.id },
                });
                tagConnections.push({ id: newTag.id });
            }
        }
    }

    const credential = await prisma.credential.create({
        data: {
            name,
            username,
            encryptedPassword,
            url: url || null,
            notes: notes || null,
            userId: session.user.id,
            tags: { connect: tagConnections },
        },
        include: { tags: { select: { id: true, name: true } } },
    });

    return NextResponse.json(
        {
            id: credential.id,
            name: credential.name,
            username: credential.username,
            url: credential.url,
            notes: credential.notes,
            tags: credential.tags,
            createdAt: credential.createdAt,
            updatedAt: credential.updatedAt,
        },
        { status: 201 }
    );
}
