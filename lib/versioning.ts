import { prisma } from "@/lib/db";
import { ContentPiece } from "@prisma/client";

/**
 * Creates a snapshot version of the current state of a ContentPiece.
 * Call this BEFORE applying updates if you want to save the previous state,
 * or AFTER if you want to checkpoint the new state.
 */
export async function snapshotPiece(
    pieceId: string,
    userId?: string,
    changelog: string = 'Snapshot'
) {
    // 1. Fetch current piece state
    const piece = await prisma.contentPiece.findUnique({
        where: { id: pieceId },
        include: {
            versions: {
                orderBy: { versionNumber: 'desc' },
                take: 1
            }
        }
    });

    if (!piece) {
        throw new Error(`ContentPiece ${pieceId} not found`);
    }

    // 2. Determine new version number
    const lastVersion = piece.versions[0];
    const newVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // 3. Create the version
    const version = await prisma.contentPieceVersion.create({
        data: {
            pieceId: piece.id,
            versionNumber: newVersionNumber,
            copy: piece.copy || {},
            visualBrief: piece.visualBrief,
            changelog,
            createdBy: userId,
        }
    });

    // 4. Update the piece to point to this as the "latest/current" version reference if needed.
    // Ideally the 'copy' in ContentPiece matches this version.
    await prisma.contentPiece.update({
        where: { id: piece.id },
        data: {
            currentVersionId: version.id
        }
    });

    return version;
}

/**
 * Restore a specific version to the main ContentPiece
 */
export async function restoreVersion(pieceId: string, versionId: string) {
    const version = await prisma.contentPieceVersion.findUnique({
        where: { id: versionId },
    });

    if (!version || version.pieceId !== pieceId) {
        throw new Error("Version not found or mismatch");
    }

    // Update piece with version data
    await prisma.contentPiece.update({
        where: { id: pieceId },
        data: {
            copy: version.copy || {},
            visualBrief: version.visualBrief,
            currentVersionId: version.id,
            // We might want to add a changelog note or something
        }
    });

    return version;
}
