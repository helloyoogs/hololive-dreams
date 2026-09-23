export type CardDetail = {
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

    media: {
        animated: boolean;

        staticImage: string;

        cardVideo: string;
        cardVideoBloom: string;

        signatureVideo: Array<{
            src: string;
            type: string;
        }>;
    };

    outfitSkill: {
        name: string;
        description: string;
    } | null;

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

export interface CardDetailClientProps {
    card: CardDetail;
}
