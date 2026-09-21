import fs from "fs";
import path from "path";

type DBRow<T> = {
    id?: string;
    group_id?: string;
    upgrade_count?: number;
    live_passive_skill_id?: string;
    live_active_skill_id?: string;
    live_special_skill_id?: string;
    level?: number;
    data: T;
};

type CardData = {
    id: string;
    characterId: string;
    nameLangId: string;
    rarity: string;
    attributeType: string;

    cardLevelGroupId: string;

    performancePermilMultiply: number;
    techniquePermilMultiply: number;
    sensePermilMultiply: number;

    cardLevelLimitGroupId: string;

    livePassiveSkillId: string;
    liveActiveSkillId: string;
    liveSpecialSkillId: string;

    cardPotentialGroupId: string;

    assetId: string;

    skillTreeConnectEffectId?: string;
    rewardCostumeId?: string;
};

type CardLevelData = {
    groupId: string;
    level: number;
    parameterBaseValue: string;
    exp: string;
    liveDeckPowerPermyriadUp: string;
};

type CardLevelLimitData = {
    groupId: string;
    levelLimit: number;
};

type CardPotentialData = {
    groupId: string;
    upgradeCount: number;
    effectType: string;
    value: string;
};

type CharacterData = {
    id: string;
    nameLangId: string;
    shortNameLangId?: string;
};

type LangData = {
    id: string;
    text: string;
};

type SkillLevelData = {
    level: number;
    descriptionLangId: string;

    livePassiveSkillId?: string;
    liveActiveSkillId?: string;
    liveSpecialSkillId?: string;

    [key: string]: unknown;
};

type ExistingCardDetailData = {
    animated?: boolean;
    cardVideo?: string;
    cardVideoBloom?: string;
    signatureVideo?: Array<{
        src: string;
        type: string;
    }>;
    otherEffects?: Array<{
        type: string;
        name?: string;
        descriptions?: string[];
        bloomUnlock?: number;
        icon?: string;
    }>;
};

function loadExistingCardDetail(
    cardId: string,
): ExistingCardDetailData | null {
    const filePath = path.join(
        process.cwd(),
        "data",
        "card-detail",
        `${cardId}.json`,
    );

    if (!fs.existsSync(filePath)) {
        return null;
    }

    return JSON.parse(
        fs.readFileSync(filePath, "utf8"),
    ) as ExistingCardDetailData;
}

function toCdnUrl(assetPath?: string): string {
    if (!assetPath) return "";

    let value = assetPath.trim();

    // 입력이 상대경로/기존 CDN URL 어느 쪽이어도 같은 CDN 구조로 정규화
    value = value
        .replace(/^https?:\/\/cdn\.holodori\.dev\//, "")
        .replace(/^\/?cdn\.holodori\.dev\//, "")
        .replace(/^\/+/, "");

    // 실제 원본 구조는 /assets/resources 및 /assets/assetbundles
    if (value.startsWith("assets/")) {
        return `https://cdn.holodori.dev/${value}`;
    }

    if (
        value.startsWith("resources/") ||
        value.startsWith("assetbundles/")
    ) {
        return `https://cdn.holodori.dev/assets/${value}`;
    }

    return `https://cdn.holodori.dev/assets/${value}`;
}

function loadJson<T>(filename: string): T {
    const filePath = path.join(process.cwd(), "data", filename);

    if (!fs.existsSync(filePath)) {
        throw new Error(`DB 파일을 찾을 수 없습니다: ${filename}`);
    }

    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function rarityNumber(rarity: string): number {
    const match = rarity.match(/RARITY_(\d+)/);
    return match ? Number(match[1]) : 0;
}

function attributeNumber(attribute: string): number {
    const match = attribute.match(/ATTRIBUTE_(\d+)/);
    return match ? Number(match[1]) : 0;
}

function getAttributeName(attribute: string): string {
    switch (attributeNumber(attribute)) {
        case 1:
            return "큐티";
        case 2:
            return "퓨어";
        case 3:
            return "해피";
        default:
            return "알 수 없음";
    }
}

function getLangText(
    rows: DBRow<LangData>[],
    id: string | undefined,
): string {
    if (!id) return "";

    const row = rows.find(
        (item) =>
            item.id === id ||
            item.data?.id === id,
    );

    return row?.data?.text ?? "";
}

function getPotentialInfo(
    card: CardData,
    potential: number,
    potentialRows: DBRow<CardPotentialData>[],
) {
    const rows = potentialRows
        .filter(
            (row) =>
                row.data.groupId === card.cardPotentialGroupId &&
                row.data.upgradeCount <= potential,
        )
        .sort(
            (a, b) =>
                a.data.upgradeCount - b.data.upgradeCount,
        );

    let parameterPermil = 0;

    let activeSkillLevelUp = 0;
    let passiveSkillLevelUp = 0;
    let specialSkillLevelUp = 0;
    let skillTreeConnectLevelUp = 0;

    const effects = rows.map((row) => {
        const value = Number(row.data.value);

        switch (row.data.effectType) {
            case "CardPotentialEffectType_CARD_POTENTIAL_EFFECT_TYPE_ALL_PARAMETER_UP_PERMIL_UP":
                parameterPermil += value;
                break;

            case "CardPotentialEffectType_CARD_POTENTIAL_EFFECT_TYPE_ACTIVE_SKILL_LEVEL_UP":
                activeSkillLevelUp += value;
                break;

            case "CardPotentialEffectType_CARD_POTENTIAL_EFFECT_TYPE_PASSIVE_SKILL_LEVEL_UP":
                passiveSkillLevelUp += value;
                break;

            case "CardPotentialEffectType_CARD_POTENTIAL_EFFECT_TYPE_SPECIAL_SKILL_LEVEL_UP":
                specialSkillLevelUp += value;
                break;

            case "CardPotentialEffectType_CARD_POTENTIAL_EFFECT_TYPE_SKILL_TREE_CONNECT_EFFECT_LEVEL_UP":
                skillTreeConnectLevelUp += value;
                break;
        }

        return {
            upgradeCount: row.data.upgradeCount,
            effectType: row.data.effectType,
            value,
        };
    });

    return {
        parameterPermil,
        parameterPercent: parameterPermil / 10,

        activeSkillLevelUp,
        passiveSkillLevelUp,
        specialSkillLevelUp,
        skillTreeConnectLevelUp,

        effects,
    };
}

function calculateStats(
    card: CardData,
    levelData: CardLevelData,
    potentialInfo: ReturnType<typeof getPotentialInfo>,
) {
    const baseValue = Number(levelData.parameterBaseValue);

    const multiplier =
        1000 + potentialInfo.parameterPermil;

    const calcStat = (statPermil: number) => {
        // 1단계: 카드의 기본 P/T/S를 각각 올림
        const baseStat = Math.ceil(
            baseValue * statPermil / 1000,
        );

        // 2단계: 개화 보너스를 적용한 뒤 다시 올림
        return Math.ceil(
            baseStat * multiplier / 1000,
        );
    };

    const performance = calcStat(
        card.performancePermilMultiply,
    );

    const technique = calcStat(
        card.techniquePermilMultiply,
    );

    const sense = calcStat(
        card.sensePermilMultiply,
    );

    return {
        baseValue,

        // 참고용 기본 parameter
        potentialBaseValue: Math.ceil(
            baseValue * multiplier / 1000,
        ),

        performance,
        technique,
        sense,

        total:
            performance +
            technique +
            sense,
    };
}
function cleanSkillDescription(text: string): string {
    return text
        .replace(/\[highlight\]/g, "")
        .replace(/\[\/highlight\]/g, "")
        .replace(/\[attribute=[^\]]+\]/g, "")
        .replace(/\[\/attribute\]/g, "")
        .trim();
}

function getSkillInfo(
    skillId: string,
    skillType: "passive" | "active" | "special",
    skillLevel: number,
) {
    if (!skillId) {
        return null;
    }

    let rows: DBRow<SkillLevelData>[];
    let langRows: DBRow<LangData>[];

    let idKey:
        | "livePassiveSkillId"
        | "liveActiveSkillId"
        | "liveSpecialSkillId";

    switch (skillType) {
        case "passive":
            rows = loadJson<DBRow<SkillLevelData>[]>(
                "LivePassiveSkillLevel.json",
            );

            langRows = loadJson<DBRow<LangData>[]>(
                "LangGeneratedLivePassiveSkillLevel_Kor.json",
            );

            idKey = "livePassiveSkillId";
            break;

        case "active":
            rows = loadJson<DBRow<SkillLevelData>[]>(
                "LiveActiveSkillLevel.json",
            );

            langRows = loadJson<DBRow<LangData>[]>(
                "LangGeneratedLiveActiveSkillLevel_Kor.json",
            );

            idKey = "liveActiveSkillId";
            break;

        case "special":
            rows = loadJson<DBRow<SkillLevelData>[]>(
                "LiveSpecialSkillLevel.json",
            );

            langRows = loadJson<DBRow<LangData>[]>(
                "LangGeneratedLiveSpecialSkillLevel_Kor.json",
            );

            idKey = "liveSpecialSkillId";
            break;
    }

    const skillRow = rows.find(
        (row) =>
            row.data?.[idKey] === skillId &&
            row.data.level === skillLevel,
    );

    if (!skillRow) {
        return null;
    }

    const description = getLangText(
        langRows,
        skillRow.data.descriptionLangId,
    );

    return {
        level: skillLevel,
        description: cleanSkillDescription(description),
        descriptionLangId:
            skillRow.data.descriptionLangId,
    };
}

export function getCardDetail(
    cardId: string,
    requestedLevel?: number,
    requestedPotential?: number,
) {
    const cards =
        loadJson<DBRow<CardData>[]>("Card.json");

    const cardRow = cards.find(
        (row) =>
            row.id === cardId ||
            row.data.id === cardId,
    );

    if (!cardRow) {
        throw new Error(`카드를 찾을 수 없습니다: ${cardId}`);
    }

    const card = cardRow.data;
    const existingDetail = loadExistingCardDetail(card.id);

    const cardLevels =
        loadJson<DBRow<CardLevelData>[]>("CardLevel.json");

    const cardLevelLimits =
        loadJson<DBRow<CardLevelLimitData>[]>(
            "CardLevelLimit.json",
        );

    const potentialRows =
        loadJson<DBRow<CardPotentialData>[]>(
            "CardPotential.json",
        );

    const characters =
        loadJson<DBRow<CharacterData>[]>("Character.json");

    const cardLang =
        loadJson<DBRow<LangData>[]>("LangCard_Kor.json");

    const characterLang =
        loadJson<DBRow<LangData>[]>(
            "LangCharacter_Kor.json",
        );

    /*
     * 카드 이름
     */
    const name =
        getLangText(cardLang, card.nameLangId) ||
        "이름 없는 카드";

    /*
     * 캐릭터
     */
    const characterRow = characters.find(
        (row) =>
            row.id === card.characterId ||
            row.data.id === card.characterId,
    );

    const character = characterRow?.data;

    const characterName =
        getLangText(
            characterLang,
            character?.nameLangId,
        ) ||
        character?.id ||
        card.characterId;

    /*
     * 최대 레벨
     */
    const levelLimitRows =
        cardLevelLimits.filter(
            (row) =>
                row.data.groupId ===
                card.cardLevelLimitGroupId,
        );

    const maxLevel = Math.max(
        ...levelLimitRows.map(
            (row) => row.data.levelLimit,
        ),
    );

    /*
     * 카드에 연결된 레벨 데이터
     */
    const levelRows = cardLevels
        .filter(
            (row) =>
                row.data.groupId ===
                card.cardLevelGroupId,
        )
        .sort(
            (a, b) =>
                a.data.level - b.data.level,
        );

    /*
     * 최대 개화 단계
     *
     * DB를 보고 자동으로 구합니다.
     */
    const cardPotentialGroupRows =
        potentialRows.filter(
            (row) =>
                row.data.groupId ===
                card.cardPotentialGroupId,
        );

    const maxPotential =
        cardPotentialGroupRows.length > 0
            ? Math.max(
                ...cardPotentialGroupRows.map(
                    (row) =>
                        row.data.upgradeCount,
                ),
            )
            : 0;

    const level =
        Math.min(
            Math.max(
                requestedLevel ??
                maxLevel,
                1,
            ),
            maxLevel,
        );

    const potential =
        Math.min(
            Math.max(
                requestedPotential ??
                maxPotential,
                0,
            ),
            maxPotential,
        );

    /*
     * 현재 개화 효과
     */
    const potentialInfo = getPotentialInfo(
        card,
        potential,
        potentialRows,
    );

    /*
     * 현재 레벨
     */
    const currentLevelRow =
        levelRows.find(
            (row) =>
                row.data.level === level,
        ) ?? levelRows[levelRows.length - 1];

    if (!currentLevelRow) {
        throw new Error(
            `카드 레벨 데이터를 찾을 수 없습니다: ${card.cardLevelGroupId}`,
        );
    }

    const currentStats = calculateStats(
        card,
        currentLevelRow.data,
        potentialInfo,
    );

    /*
     * 모든 레벨 × 모든 개화의 스탯을
     * 서버에서 미리 계산해 둡니다.
     *
     * 클라이언트에서는 숫자를 다시 계산하지 않습니다.
     */
    const levelPotentialStats = levelRows.flatMap(
        (levelRow) =>
            Array.from(
                {
                    length: maxPotential + 1,
                },
                (_, currentPotential) => {
                    const info =
                        getPotentialInfo(
                            card,
                            currentPotential,
                            potentialRows,
                        );

                    const stats =
                        calculateStats(
                            card,
                            levelRow.data,
                            info,
                        );

                    /*
                     * 현재 개화 단계에 따른 스킬 레벨
                     *
                     * 이 DB에서는 스킬 레벨이 1 / 2만 존재합니다.
                     * 개화로 해당 스킬 레벨업 효과가 해금되면 Lv 2입니다.
                     */
                    const passiveSkillLevel =
                        info.passiveSkillLevelUp > 0
                            ? 2
                            : 1;

                    const activeSkillLevel =
                        info.activeSkillLevelUp > 0
                            ? 2
                            : 1;

                    const specialSkillLevel =
                        info.specialSkillLevelUp > 0
                            ? 2
                            : 1;

                    /*
                     * 현재 개화 단계에 맞는 실제 스킬 설명
                     */
                    const passiveSkill =
                        getSkillInfo(
                            card.livePassiveSkillId,
                            "passive",
                            passiveSkillLevel,
                        );

                    const activeSkill =
                        getSkillInfo(
                            card.liveActiveSkillId,
                            "active",
                            activeSkillLevel,
                        );

                    const specialSkill =
                        getSkillInfo(
                            card.liveSpecialSkillId,
                            "special",
                            specialSkillLevel,
                        );

                    return {
                        level: levelRow.data.level,
                        potential: currentPotential,

                        ...stats,

                        parameterPermil:
                            info.parameterPermil,

                        parameterPercent:
                            info.parameterPercent,

                        passiveSkillLevelUp:
                            info.passiveSkillLevelUp,

                        activeSkillLevelUp:
                            info.activeSkillLevelUp,

                        specialSkillLevelUp:
                            info.specialSkillLevelUp,

                        skillTreeConnectLevelUp:
                            info.skillTreeConnectLevelUp,

                        /*
                         * 현재 개화 단계의 스킬 정보
                         */
                        passiveSkill: {
                            level: passiveSkillLevel,
                            description:
                                passiveSkill?.description ?? "",
                        },

                        activeSkill: {
                            level: activeSkillLevel,
                            description:
                                activeSkill?.description ?? "",
                        },

                        specialSkill: {
                            level: specialSkillLevel,
                            description:
                                specialSkill?.description ?? "",
                        },
                    };
                },
            ),
    );

    /*
     * 개화 효과 설명
     */
    const potentialEffects = [...cardPotentialGroupRows]
        .sort(
            (a, b) =>
                a.data.upgradeCount -
                b.data.upgradeCount,
        )
        .map((row) => {
            const value =
                Number(row.data.value);

            let label = "";

            switch (row.data.effectType) {
                case "CardPotentialEffectType_CARD_POTENTIAL_EFFECT_TYPE_ACTIVE_SKILL_LEVEL_UP":
                    label = `액티브 스킬 Lv +${value}`;
                    break;

                case "CardPotentialEffectType_CARD_POTENTIAL_EFFECT_TYPE_PASSIVE_SKILL_LEVEL_UP":
                    label = `패시브 스킬 Lv +${value}`;
                    break;

                case "CardPotentialEffectType_CARD_POTENTIAL_EFFECT_TYPE_SPECIAL_SKILL_LEVEL_UP":
                    label = `스페셜 스킬 Lv +${value}`;
                    break;

                case "CardPotentialEffectType_CARD_POTENTIAL_EFFECT_TYPE_ALL_PARAMETER_UP_PERMIL_UP":
                    label = `전체 파라미터 +${value / 10}%`;
                    break;

                case "CardPotentialEffectType_CARD_POTENTIAL_EFFECT_TYPE_SKILL_TREE_CONNECT_EFFECT_LEVEL_UP":
                    label = `스킬 트리 연결 효과 Lv +${value}`;
                    break;

                default:
                    label = row.data.effectType;
            }

            return {
                upgradeCount:
                    row.data.upgradeCount,
                label,
                unlocked:
                    potential >=
                    row.data.upgradeCount,
            };
        });

    /*
     * 현재 스킬 레벨
     *
     * 기본 Lv 1 + 개화 효과
     */
    const passiveSkillLevel =
        potentialInfo.passiveSkillLevelUp > 0 ? 2 : 1;

    const activeSkillLevel =
        potentialInfo.activeSkillLevelUp > 0 ? 2 : 1;

    const specialSkillLevel =
        potentialInfo.specialSkillLevelUp > 0 ? 2 : 1;


    const passiveSkill = getSkillInfo(
        card.livePassiveSkillId,
        "passive",
        passiveSkillLevel,
    );

    const activeSkill = getSkillInfo(
        card.liveActiveSkillId,
        "active",
        activeSkillLevel,
    );

    const specialSkill = getSkillInfo(
        card.liveSpecialSkillId,
        "special",
        specialSkillLevel,
    );

    const outfitEffect = existingDetail?.otherEffects?.find(
        (effect) => effect.type === "outfit",
    );

    const outfitSkill = outfitEffect
        ? {
            name: outfitEffect.name ?? "의상 스킬",
            description: cleanSkillDescription(
                outfitEffect.descriptions?.[0] ?? "",
            ),
        }
        : null;

    const media = {
        animated: existingDetail?.animated ?? false,
        staticImage: `/cdn.holodori.dev/assets/assetbundles/img_card_full_${card.assetId}/img_card_full_${card.assetId}_unsquished.webp`,
        cardVideo: toCdnUrl(existingDetail?.cardVideo),
        cardVideoBloom: toCdnUrl(existingDetail?.cardVideoBloom),
        signatureVideo: (existingDetail?.signatureVideo ?? []).map(
            (source) => ({
                src: toCdnUrl(source.src),
                type: source.type,
            }),
        ),
    };

    return {
        id: card.id,

        name,
        characterName,

        rarity: rarityNumber(card.rarity),
        attribute: getAttributeName(
            card.attributeType,
        ),

        assetId: card.assetId,

        level,
        maxLevel,

        potential,
        maxPotential,

        stats: currentStats,

        levelPotentialStats,

        potentialEffects,

        media,
        outfitSkill,

        skills: {
            passive: {
                level: passiveSkillLevel,
                description:
                    passiveSkill?.description ?? "",
            },

            active: {
                level: activeSkillLevel,
                description:
                    activeSkill?.description ?? "",
            },

            special: {
                level: specialSkillLevel,
                description:
                    specialSkill?.description ?? "",
            },
        },
    };
}
