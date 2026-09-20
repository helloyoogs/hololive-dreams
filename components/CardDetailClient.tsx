"use client";

import { useMemo, useState } from "react";

type CardDetail = {
    id: string;

    name: string;
    characterName: string;

    rarity: number;
    attribute: string;

    assetId: string;

    level: number;
    maxLevel: number;

    potential: number;
    maxPotential: number;

    stats: {
        baseValue: number;
        potentialBaseValue: number;
        performance: number;
        technique: number;
        sense: number;
        total: number;
    };

    levelPotentialStats: Array<{
        level: number;
        potential: number;
        baseValue: number;
        potentialBaseValue: number;
        performance: number;
        technique: number;
        sense: number;
        total: number;
        parameterPermil: number;
        parameterPercent: number;
        passiveSkillLevelUp: number;
        activeSkillLevelUp: number;
        specialSkillLevelUp: number;
        skillTreeConnectLevelUp: number;

        passiveSkill: {
            level: number;
            description: string;
        };

        activeSkill: {
            level: number;
            description: string;
        };

        specialSkill: {
            level: number;
            description: string;
        };
    }>;

    potentialEffects: Array<{
        upgradeCount: number;
        label: string;
        unlocked: boolean;
    }>;

    skills: {
        passive: {
            level: number;
            description: string;
        };

        active: {
            level: number;
            description: string;
        };

        special: {
            level: number;
            description: string;
        };
    };
};

interface Props {
    card: CardDetail;
}

function formatNumber(value: number) {
    return value.toLocaleString("ko-KR");
}

function Stars({
    rarity,
}: {
    rarity: number;
}) {
    return (
        <div className="flex gap-1">
            {Array.from(
                { length: 5 },
                (_, index) => (
                    <span
                        key={index}
                        className={
                            index < rarity
                                ? "text-yellow-300"
                                : "text-slate-700"
                        }
                    >
                        ★
                    </span>
                ),
            )}
        </div>
    );
}

function StatBox({
    title,
    value,
    description,
}: {
    title: string;
    value: number;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#102657] p-5">
            <div className="mb-2 text-sm font-medium text-slate-400">
                {title}
            </div>

            <div className="text-3xl font-black tracking-tight text-white">
                {formatNumber(value)}
            </div>

            <div className="mt-1 text-xs text-slate-500">
                {description}
            </div>
        </div>
    );
}

function SkillBox({
    title,
    level,
    description,
}: {
    title: string;
    level: number;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#102657] p-5">
            <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-white">
                    {title}
                </h3>

                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                    Lv {level}
                </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-300">
                {description || "설명이 없습니다."}
            </p>
        </div>
    );
}

export default function CardDetailClient({
    card,
}: Props) {
    const [level, setLevel] = useState(card.level);
    const [potential, setPotential] = useState(
        card.potential,
    );

    console.log("CLIENT potential:", potential);

    const current = useMemo(() => {
        return (
            card.levelPotentialStats.find(
                (item) =>
                    item.level === level &&
                    item.potential === potential,
            ) ??
            card.levelPotentialStats.find(
                (item) =>
                    item.level === level,
            ) ??
            card.levelPotentialStats[0]
        );
    }, [
        card.levelPotentialStats,
        level,
        potential,
    ]);

    if (!current) {
        return null;
    }

    return (
        <main className="min-h-screen bg-[#07183f] px-4 py-8 text-white md:px-8">
            <div className="mx-auto max-w-7xl">
                {/* 상단 */}
                <div className="mb-8">
                    <div className="mb-2 text-sm text-blue-300">
                        CARD DETAIL
                    </div>

                    <h1 className="text-3xl font-black md:text-4xl">
                        {card.name}
                    </h1>

                    <p className="mt-2 text-slate-400">
                        {card.characterName}
                    </p>
                </div>

                {/* 카드 기본 정보 */}
                <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    {/* 이미지 */}
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c2452]">
                        <div className="aspect-[3/4] w-full">
                            <img
                                src={`/cards/${card.assetId}.png`}
                                alt={card.name}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                    event.currentTarget.style.display =
                                        "none";
                                }}
                            />
                        </div>
                    </div>

                    {/* 정보 */}
                    <div className="rounded-3xl border border-white/10 bg-[#0c2452] p-6 md:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <div className="mb-3">
                                    <Stars
                                        rarity={card.rarity}
                                    />
                                </div>

                                <h2 className="text-2xl font-black md:text-3xl">
                                    {card.name}
                                </h2>

                                <p className="mt-2 text-slate-400">
                                    {card.characterName}
                                </p>
                            </div>

                            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold">
                                {card.attribute}
                            </div>
                        </div>

                        {/* 레벨 */}
                        <div className="mt-10">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="font-bold">
                                    레벨
                                </span>

                                <span className="font-black text-blue-300">
                                    Lv {level} /{" "}
                                    {card.maxLevel}
                                </span>
                            </div>

                            <input
                                type="range"
                                min={1}
                                max={card.maxLevel}
                                value={level}
                                onChange={(event) =>
                                    setLevel(
                                        Number(
                                            event.target
                                                .value,
                                        ),
                                    )
                                }
                                className="w-full accent-blue-500"
                            />

                            <div className="mt-2 flex justify-between text-xs text-slate-500">
                                <span>Lv 1</span>
                                <span>
                                    Lv {card.maxLevel}
                                </span>
                            </div>
                        </div>

                        {/* 개화 */}
                        <div className="mt-8">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="font-bold">
                                    개화
                                </span>

                                <span className="font-black text-purple-300">
                                    {potential} /{" "}
                                    {card.maxPotential}
                                </span>
                            </div>

                            <div className="grid grid-cols-6 gap-2">
                                {Array.from(
                                    {
                                        length:
                                            card.maxPotential +
                                            1,
                                    },
                                    (_, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() =>
                                                setPotential(
                                                    index,
                                                )
                                            }
                                            className={[
                                                "rounded-xl py-3 text-sm font-black transition",
                                                potential ===
                                                    index
                                                    ? "bg-purple-500 text-white"
                                                    : "bg-white/5 text-slate-400 hover:bg-white/10",
                                            ].join(
                                                " ",
                                            )}
                                        >
                                            {index}
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>

                        {/* 현재 개화의 스탯 보너스 */}
                        <div className="mt-8 rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-purple-300">
                                현재 개화 스탯 보너스
                            </div>

                            <div className="mt-2 text-2xl font-black">
                                +
                                {
                                    current.parameterPercent
                                }
                                %
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                                전체 파라미터
                            </div>
                        </div>
                    </div>
                </section>

                {/* 능력치 */}
                <section className="mt-8">
                    <div className="mb-4">
                        <h2 className="text-2xl font-black">
                            능력치
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Lv {level} / 개화{" "}
                            {potential}
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatBox
                            title="PERFORMANCE"
                            value={
                                current.performance
                            }
                            description="퍼포먼스"
                        />

                        <StatBox
                            title="TECHNIQUE"
                            value={
                                current.technique
                            }
                            description="테크닉"
                        />

                        <StatBox
                            title="SENSE"
                            value={current.sense}
                            description="센스"
                        />

                        <StatBox
                            title="TOTAL"
                            value={current.total}
                            description="총합"
                        />
                    </div>
                </section>

                {/* 개화 효과 */}
                <section className="mt-10">
                    <div className="mb-4">
                        <h2 className="text-2xl font-black">
                            개화 효과
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            개화 단계별 잠재력 효과
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {card.potentialEffects.map(
                            (effect) => (
                                <div
                                    key={
                                        effect.upgradeCount
                                    }
                                    className={[
                                        "rounded-2xl border p-4 transition",
                                        effect.unlocked
                                            ? "border-purple-400/30 bg-purple-500/10"
                                            : "border-white/10 bg-[#0c2452] opacity-50",
                                    ].join(
                                        " ",
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={[
                                                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-black",
                                                effect.unlocked
                                                    ? "bg-purple-500 text-white"
                                                    : "bg-white/10 text-slate-500",
                                            ].join(
                                                " ",
                                            )}
                                        >
                                            {
                                                effect.upgradeCount
                                            }
                                        </div>

                                        <div className="font-bold">
                                            {
                                                effect.label
                                            }
                                        </div>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </section>

                {/* 스킬 */}
                <section className="mt-10 pb-12">
                    <div className="mb-4">
                        <h2 className="text-2xl font-black">
                            스킬
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            현재 개화 상태가 적용된 스킬 레벨
                        </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <SkillBox
                            title="패시브 스킬"
                            level={current.passiveSkill.level}
                            description={current.passiveSkill.description}
                        />

                        <SkillBox
                            title="액티브 스킬"
                            level={current.activeSkill.level}
                            description={current.activeSkill.description}
                        />

                        <SkillBox
                            title="스페셜 스킬"
                            level={current.specialSkill.level}
                            description={current.specialSkill.description}
                        />
                    </div>
                </section>
            </div>
        </main>
    );
}