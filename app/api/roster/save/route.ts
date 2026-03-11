import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { getSessionFromCookies } from "../../../../lib/auth";
import {
  GENDER_OPTIONS,
  PRODUCT_OPTIONS,
  SLEEVE_TYPES,
  isValidProductKey
} from "../../../../lib/products";

const sizeSchema = z.enum(["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "8Y", "10Y", "12Y", "14Y", "16Y"]);

const playerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  jerseyNumber: z.number().int().min(0).max(999),
  gender: z.enum(GENDER_OPTIONS),
  sleeveType: z.enum(SLEEVE_TYPES),
  sizeUS: sizeSchema.nullable().optional(),
  playingTShirtQty: z.number().int().min(0).nullable().optional(),
  trousersSizeUS: sizeSchema.nullable().optional(),
  trousersQty: z.number().int().min(0).nullable().optional(),
  trainingTShirtSizeUS: sizeSchema.nullable().optional(),
  trainingTShirtQty: z.number().int().min(0).nullable().optional(),
  shortsSizeUS: sizeSchema.nullable().optional(),
  shortsQty: z.number().int().min(0).nullable().optional(),
  jacketSizeUS: sizeSchema.nullable().optional(),
  jacketQty: z.number().int().min(0).nullable().optional(),
  travelTrousersSizeUS: sizeSchema.nullable().optional(),
  travelTrousersQty: z.number().int().min(0).nullable().optional(),
  sleevelessJacketSizeUS: sizeSchema.nullable().optional(),
  sleevelessJacketQty: z.number().int().min(0).nullable().optional(),
  hoodieSizeUS: sizeSchema.nullable().optional(),
  hoodieQty: z.number().int().min(0).nullable().optional(),
  travelPoloSizeUS: sizeSchema.nullable().optional(),
  travelPoloQty: z.number().int().min(0).nullable().optional(),
  hatQty: z.number().int().min(0).nullable().optional(),
  capQty: z.number().int().min(0).nullable().optional()
});

const saveSchema = z.object({
  rosterName: z.string().min(1),
  players: z.array(playerSchema).min(1)
});

function normalizePlayerForComparison(player: Record<string, unknown>) {
  return {
    name: String(player.name),
    jerseyNumber: Number(player.jerseyNumber),
    gender: String(player.gender),
    sleeveType: String(player.sleeveType),
    sizeUS: player.sizeUS ?? null,
    playingTShirtQty: player.playingTShirtQty ?? null,
    trousersSizeUS: player.trousersSizeUS ?? null,
    trousersQty: player.trousersQty ?? null,
    trainingTShirtSizeUS: player.trainingTShirtSizeUS ?? null,
    trainingTShirtQty: player.trainingTShirtQty ?? null,
    shortsSizeUS: player.shortsSizeUS ?? null,
    shortsQty: player.shortsQty ?? null,
    jacketSizeUS: player.jacketSizeUS ?? null,
    jacketQty: player.jacketQty ?? null,
    travelTrousersSizeUS: player.travelTrousersSizeUS ?? null,
    travelTrousersQty: player.travelTrousersQty ?? null,
    sleevelessJacketSizeUS: player.sleevelessJacketSizeUS ?? null,
    sleevelessJacketQty: player.sleevelessJacketQty ?? null,
    hoodieSizeUS: player.hoodieSizeUS ?? null,
    hoodieQty: player.hoodieQty ?? null,
    travelPoloSizeUS: player.travelPoloSizeUS ?? null,
    travelPoloQty: player.travelPoloQty ?? null,
    hatQty: player.hatQty ?? null,
    capQty: player.capQty ?? null
  };
}

export async function POST(req: NextRequest) {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = saveSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid roster data." },
        { status: 400 }
      );
    }

    const { players } = parsed.data;

    const team = await prisma.team.findUnique({
      where: { id: session.teamId },
      include: { players: true }
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    const enabledProducts = team.enabledProducts?.filter(isValidProductKey) || [];
    const enabledDefs = PRODUCT_OPTIONS.filter((p) => enabledProducts.includes(p.key));

    const existingById = new Map(team.players.map((p) => [p.id, p]));
    const incomingById = new Map(
      players.filter((p) => p.id).map((p) => [p.id as string, p])
    );

    // Lock existing DB records for team members: no update and no delete.
    for (const existing of team.players) {
      const incoming = incomingById.get(existing.id);
      if (!incoming) {
        return NextResponse.json(
          { error: "Existing player records cannot be removed." },
          { status: 400 }
        );
      }

      const existingNorm = normalizePlayerForComparison(existing as unknown as Record<string, unknown>);
      const incomingNorm = normalizePlayerForComparison(incoming as unknown as Record<string, unknown>);

      if (JSON.stringify(existingNorm) !== JSON.stringify(incomingNorm)) {
        return NextResponse.json(
          { error: "Existing player records are locked and cannot be edited." },
          { status: 400 }
        );
      }
    }

    // Validate only new rows for required enabled products.
    for (const p of players.filter((x) => !x.id)) {
      for (const product of enabledDefs) {
        if ("sizeField" in product) {
          const size = (p as unknown as Record<string, unknown>)[product.sizeField];
          if (!size) {
            return NextResponse.json(
              { error: `Size is required for ${product.label}.` },
              { status: 400 }
            );
          }
        }
        if ("qtyField" in product) {
          const qty = (p as unknown as Record<string, unknown>)[product.qtyField];
          if (qty == null || Number(qty) < 0) {
            return NextResponse.json(
              { error: `Valid quantity is required for ${product.label}.` },
              { status: 400 }
            );
          }
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdPlayers = [];

      for (const p of players) {
        if (p.id && existingById.has(p.id)) {
          createdPlayers.push(existingById.get(p.id)!);
          continue;
        }

        const created = await tx.player.create({
          data: {
            teamId: team.id,
            name: p.name,
            jerseyNumber: p.jerseyNumber,
            gender: p.gender,
            sleeveType: p.sleeveType,
            sizeUS: p.sizeUS || "M",
            playingTShirtQty: p.playingTShirtQty ?? 1,
            trousersSizeUS: p.trousersSizeUS || null,
            trousersQty: p.trousersQty ?? null,
            trainingTShirtSizeUS: p.trainingTShirtSizeUS || null,
            trainingTShirtQty: p.trainingTShirtQty ?? null,
            shortsSizeUS: p.shortsSizeUS || null,
            shortsQty: p.shortsQty ?? null,
            jacketSizeUS: p.jacketSizeUS || null,
            jacketQty: p.jacketQty ?? null,
            travelTrousersSizeUS: p.travelTrousersSizeUS || null,
            travelTrousersQty: p.travelTrousersQty ?? null,
            sleevelessJacketSizeUS: p.sleevelessJacketSizeUS || null,
            sleevelessJacketQty: p.sleevelessJacketQty ?? null,
            hoodieSizeUS: p.hoodieSizeUS || null,
            hoodieQty: p.hoodieQty ?? null,
            travelPoloSizeUS: p.travelPoloSizeUS || null,
            travelPoloQty: p.travelPoloQty ?? null,
            hatQty: p.hatQty ?? null,
            capQty: p.capQty ?? null
          }
        });
        createdPlayers.push(created);
      }

      return createdPlayers;
    });

    return NextResponse.json({
      success: true,
      players: result.map((p) => ({
        id: p.id,
        name: p.name,
        jerseyNumber: p.jerseyNumber,
        gender: p.gender,
        sleeveType: p.sleeveType,
        sizeUS: p.sizeUS,
        playingTShirtQty: p.playingTShirtQty,
        trousersSizeUS: p.trousersSizeUS,
        trousersQty: p.trousersQty,
        trainingTShirtSizeUS: p.trainingTShirtSizeUS,
        trainingTShirtQty: p.trainingTShirtQty,
        shortsSizeUS: p.shortsSizeUS,
        shortsQty: p.shortsQty,
        jacketSizeUS: p.jacketSizeUS,
        jacketQty: p.jacketQty,
        travelTrousersSizeUS: p.travelTrousersSizeUS,
        travelTrousersQty: p.travelTrousersQty,
        sleevelessJacketSizeUS: p.sleevelessJacketSizeUS,
        sleevelessJacketQty: p.sleevelessJacketQty,
        hoodieSizeUS: p.hoodieSizeUS,
        hoodieQty: p.hoodieQty,
        travelPoloSizeUS: p.travelPoloSizeUS,
        travelPoloQty: p.travelPoloQty,
        hatQty: p.hatQty,
        capQty: p.capQty
      }))
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to save roster. Please try again later." },
      { status: 500 }
    );
  }
}
