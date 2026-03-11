import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../../lib/prisma";
import { getAdminSessionFromCookies } from "../../../../../../lib/auth";
import {
  GENDER_OPTIONS,
  PRODUCT_OPTIONS,
  SLEEVE_TYPES,
  isValidProductKey
} from "../../../../../../lib/products";

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

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const adminSession = getAdminSessionFromCookies();
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = saveSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid roster data." }, { status: 400 });
    }

    const { rosterName, players } = parsed.data;

    const team = await prisma.team.findFirst({
      where: {
        id: params.teamId,
        managerEmail: {
          equals: adminSession.email,
          mode: "insensitive"
        }
      },
      include: { players: true }
    });

    if (!team) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const enabledProducts = team.enabledProducts?.filter(isValidProductKey) || [];
    const enabledDefs = PRODUCT_OPTIONS.filter((p) => enabledProducts.includes(p.key));

    for (const p of players) {
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

    const existingById = new Map(team.players.map((p) => [p.id, p]));
    const incomingIds = new Set(players.map((p) => p.id).filter(Boolean));

    const result = await prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: { id: team.id },
        data: { rosterName }
      });

      for (const existing of team.players) {
        if (!incomingIds.has(existing.id)) {
          await tx.player.delete({ where: { id: existing.id } });
        }
      }

      const saved = [];
      for (const p of players) {
        if (p.id && existingById.has(p.id)) {
          const updated = await tx.player.update({
            where: { id: p.id },
            data: {
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
          saved.push(updated);
        } else {
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
          saved.push(created);
        }
      }

      return saved;
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
