import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/credentials/[id]/reveal — decrypt and return password
export async function GET(req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const credential = await prisma.credential.findFirst({
        where: { id, userId: session.user.id },
        select: { encryptedPassword: true },
    });

    if (!credential) {
        return NextResponse.json(
            { error: "Credential not found" },
            { status: 404 }
        );
    }

    try {
        const password = decrypt(credential.encryptedPassword);
        return NextResponse.json({ password });
    } catch {
        return NextResponse.json(
            { error: "Failed to decrypt password" },
            { status: 500 }
        );
    }
}
