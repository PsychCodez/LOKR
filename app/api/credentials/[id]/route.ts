import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/credentials/[id] — get single credential with decrypted password
export async function GET(req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const credential = await prisma.credential.findFirst({
        where: { id, userId: session.user.id },
        include: { tags: { select: { id: true, name: true } } },
    });

    if (!credential) {
        return NextResponse.json(
            { error: "Credential not found" },
            { status: 404 }
        );
    }

    let password: string;
    try {
        password = decrypt(credential.encryptedPassword);
    } catch {
        return NextResponse.json(
            { error: "Failed to decrypt password" },
            { status: 500 }
        );
    }

    return NextResponse.json({
        id: credential.id,
        name: credential.name,
        username: credential.username,
        password,
        url: credential.url,
        notes: credential.notes,
        tags: credential.tags,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
    });
}

// PUT /api/credentials/[id] — update credential
export async function PUT(req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.credential.findFirst({
        where: { id, userId: session.user.id },
        include: { tags: true },
    });

    if (!existing) {
        return NextResponse.json(
            { error: "Credential not found" },
            { status: 404 }
        );
    }

    const body = await req.json();
    const { name, username, password, url, notes, tags } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (password !== undefined) updateData.encryptedPassword = encrypt(password);
    if (url !== undefined) updateData.url = url || null;
    if (notes !== undefined) updateData.notes = notes || null;

    // Handle tags
    if (tags !== undefined && Array.isArray(tags)) {
        const tagConnections = [];
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
        updateData.tags = {
            set: [], // disconnect all existing
            connect: tagConnections, // connect new set
        };
    }

    const credential = await prisma.credential.update({
        where: { id },
        data: updateData,
        include: { tags: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
        id: credential.id,
        name: credential.name,
        username: credential.username,
        url: credential.url,
        notes: credential.notes,
        tags: credential.tags,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
    });
}

// DELETE /api/credentials/[id] — delete credential
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.credential.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!existing) {
        return NextResponse.json(
            { error: "Credential not found" },
            { status: 404 }
        );
    }

    await prisma.credential.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
