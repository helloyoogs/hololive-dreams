"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

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

interface Props {
    card: CardDetail;
}

/**
 * DB/CDN 경로를 Next.js public 폴더의
 * 로컬 URL로 변환합니다.
 */
function toLocalAssetUrl(src: string): string {
    if (!src) return "";

    let value = src.trim();

    // 원격 CDN origin 제거
    value = value.replace(
        /^https?:\/\/cdn\.holodori\.dev\//,
        "",
    );

    // 이미 로컬용 prefix가 붙어 있어도 다시 정규화
    value = value.replace(
        /^\/?cdn\.holodori\.dev\//,
        "",
    );

    // 맨 앞 / 제거
    value = value.replace(/^\/+/, "");

    // assets가 이미 있으면 그대로
    if (value.startsWith("assets/")) {
        return `/cdn.holodori.dev/${value}`;
    }

    // 원본 CDN에서 resources와 assetbundles는 assets 아래에 있음
    if (
        value.startsWith("resources/") ||
        value.startsWith("assetbundles/")
    ) {
        return `/cdn.holodori.dev/assets/${value}`;
    }

    return `/cdn.holodori.dev/assets/${value}`;
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
    level?: number;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#102657] p-5">
            <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-white">
                    {title}
                </h3>

                {level !== undefined && (
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                        Lv {level}
                    </span>
                )}
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
    const [level, setLevel] =
        useState(card.level);

    const [potential, setPotential] =
        useState(card.potential);

    const [
        animationEnabled,
        setAnimationEnabled,
    ] = useState(true);

    const [
        signatureEnabled,
        setSignatureEnabled,
    ] = useState(true);

    /*
     * 카드 영상과 사인 영상은 별도의 video입니다.
     *
     * 카드 영상:
     *   계속 반복 재생
     *
     * 사인 영상:
     *   카드 위에 overlay
     */
    const cardVideoRef =
        useRef<HTMLVideoElement>(null);

    const signatureVideoRef =
        useRef<HTMLVideoElement>(null);

    const signatureCanvasRef =
        useRef<HTMLCanvasElement>(null);

    /*
     * 현재 레벨 + 개화 단계 데이터
     */
    const current = useMemo(() => {
        return (
            card.levelPotentialStats.find(
                (item) =>
                    item.level === level &&
                    item.potential ===
                    potential,
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

    /*
     * 최대 개화 상태에서는 Bloom 영상 사용.
     *
     * Bloom 영상이 없으면 일반 영상으로
     * 자동 fallback.
     */
    // 다운로드된 원본 기본 카드 애니메이션(full_0)을 사용합니다.
    const rawCardVideo = card.media.cardVideo;

    const cardVideoSrc =
        toLocalAssetUrl(rawCardVideo);

    const staticImageSrc =
        toLocalAssetUrl(card.media.staticImage);

    const signatureVideoSources = useMemo(
        () =>
            card.media.signatureVideo.map(
                (source) => ({
                    ...source,
                    src: toLocalAssetUrl(source.src),
                }),
            ),
        [card.media.signatureVideo],
    );

    const signatureSourceKey =
        useMemo(
            () =>
                signatureVideoSources
                    .map(
                        (source) =>
                            source.src,
                    )
                    .join("|"),
            [signatureVideoSources],
        );

    /*
     * 카드 애니메이션 자동재생
     *
     * Animation ON
     * 또는 개화 변경으로 영상이 바뀌면
     * 처음부터 자동 재생합니다.
     */
    useEffect(() => {
        const video =
            cardVideoRef.current;

        if (
            !video ||
            !animationEnabled ||
            !cardVideoSrc
        ) {
            return;
        }

        video.muted = true;
        video.loop = true;
        video.defaultMuted = true;
        video.load();

        const play = async () => {
            try {
                await video.play();
            } catch (error) {
                console.error(
                    "카드 영상 자동재생 실패:",
                    error,
                );
            }
        };

        if (video.readyState >= 2) {
            void play();
        } else {
            const handleCanPlay = () => {
                void play();
            };

            video.addEventListener(
                "canplay",
                handleCanPlay,
                {
                    once: true,
                },
            );

            return () => {
                video.removeEventListener(
                    "canplay",
                    handleCanPlay,
                );
            };
        }
    }, [
        animationEnabled,
        cardVideoSrc,
    ]);

    /*
     * 사인 애니메이션
     *
     * 원본 사이트와 같은 구조입니다.
     * - 사인 MP4는 화면에 직접 표시하지 않습니다.
     * - 숨겨진 video에서 프레임을 읽습니다.
     * - H.264 fallback 영상은 위쪽 절반이 RGB,
     *   아래쪽 절반이 alpha mask인 형태입니다.
     * - 두 절반을 합성해서 투명한 1280x720 canvas에 그립니다.
     */
    useEffect(() => {
        const video = signatureVideoRef.current;
        const canvas = signatureCanvasRef.current;

        if (
            !video ||
            !canvas ||
            !signatureEnabled ||
            signatureVideoSources.length === 0
        ) {
            const context = canvas?.getContext("2d");
            if (context && canvas) {
                context.clearRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                );
            }
            return;
        }

        const context = canvas.getContext("2d", {
            willReadFrequently: true,
        });

        if (!context) return;

        const frameCanvas = document.createElement("canvas");
        const frameContext = frameCanvas.getContext("2d", {
            willReadFrequently: true,
        });

        if (!frameContext) return;

        let stopped = false;
        let animationFrameId = 0;
        let videoFrameId: number | null = null;

        const clearCanvas = () => {
            context.clearRect(
                0,
                0,
                canvas.width,
                canvas.height,
            );
        };

        const renderSignatureFrame = () => {
            if (
                stopped ||
                video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
                video.videoWidth <= 0 ||
                video.videoHeight <= 0
            ) {
                return;
            }

            const sourceWidth = video.videoWidth;
            const sourceHeight = video.videoHeight;

            /*
             * H.264 사인 영상은 보통:
             *   1280 x 1440
             *   ┌──────────────┐
             *   │ RGB 1280x720 │
             *   ├──────────────┤
             *   │ MASK1280x720 │
             *   └──────────────┘
             *
             * 출력 canvas는 1280 x 720입니다.
             */
            const packedAlpha = sourceHeight >= sourceWidth;
            const outputHeight = packedAlpha
                ? Math.floor(sourceHeight / 2)
                : sourceHeight;

            if (
                canvas.width !== sourceWidth ||
                canvas.height !== outputHeight
            ) {
                canvas.width = sourceWidth;
                canvas.height = outputHeight;
            }

            frameCanvas.width = sourceWidth;
            frameCanvas.height = sourceHeight;

            frameContext.clearRect(
                0,
                0,
                sourceWidth,
                sourceHeight,
            );
            frameContext.drawImage(
                video,
                0,
                0,
                sourceWidth,
                sourceHeight,
            );

            if (!packedAlpha) {
                // HEVC alpha가 브라우저에서 실제 투명도로 decode되는 경우.
                context.clearRect(
                    0,
                    0,
                    sourceWidth,
                    outputHeight,
                );
                context.drawImage(
                    video,
                    0,
                    0,
                    sourceWidth,
                    outputHeight,
                );
                return;
            }

            const color = frameContext.getImageData(
                0,
                0,
                sourceWidth,
                outputHeight,
            );

            const mask = frameContext.getImageData(
                0,
                outputHeight,
                sourceWidth,
                outputHeight,
            );

            const colorData = color.data;
            const maskData = mask.data;

            for (
                let index = 0;
                index < colorData.length;
                index += 4
            ) {
                // mask는 흑백이므로 RGB 중 한 채널만 사용하면 됩니다.
                colorData[index + 3] = maskData[index];
            }

            context.clearRect(
                0,
                0,
                sourceWidth,
                outputHeight,
            );
            context.putImageData(color, 0, 0);
        };

        const scheduleFrame = () => {
            if (stopped) return;

            const videoWithFrameCallback = video as HTMLVideoElement & {
                requestVideoFrameCallback?: (
                    callback: () => void,
                ) => number;
                cancelVideoFrameCallback?: (id: number) => void;
            };

            if (videoWithFrameCallback.requestVideoFrameCallback) {
                videoFrameId =
                    videoWithFrameCallback.requestVideoFrameCallback(
                        () => {
                            renderSignatureFrame();
                            scheduleFrame();
                        },
                    );
            } else {
                animationFrameId = requestAnimationFrame(() => {
                    renderSignatureFrame();
                    scheduleFrame();
                });
            }
        };

        const start = async () => {
            try {
                clearCanvas();
                video.muted = true;
                video.defaultMuted = true;
                video.loop = false;
                video.currentTime = 0;

                await video.play();
                scheduleFrame();
            } catch (error) {
                console.error(
                    "사인 영상 자동재생 실패:",
                    error,
                );
            }
        };

        const handleLoadedData = () => {
            void start();
        };

        const handleEnded = () => {
            // 마지막 프레임은 canvas에 남겨서 완성된 사인을 유지합니다.
            renderSignatureFrame();
        };

        video.addEventListener("loadeddata", handleLoadedData);
        video.addEventListener("ended", handleEnded);

        video.load();

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            void start();
        }

        return () => {
            stopped = true;

            video.removeEventListener(
                "loadeddata",
                handleLoadedData,
            );
            video.removeEventListener("ended", handleEnded);

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            const videoWithFrameCallback = video as HTMLVideoElement & {
                cancelVideoFrameCallback?: (id: number) => void;
            };

            if (
                videoFrameId !== null &&
                videoWithFrameCallback.cancelVideoFrameCallback
            ) {
                videoWithFrameCallback.cancelVideoFrameCallback(
                    videoFrameId,
                );
            }
        };
    }, [
        signatureEnabled,
        signatureSourceKey,
        signatureVideoSources.length,
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
                <section className="grid gap-8 lg:grid-cols-[420px_1fr]">
                    {/* 카드 뷰어 */}
                    <div className="mx-auto w-full max-w-[420px] lg:mx-0">
                        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c2452] p-3 shadow-2xl shadow-black/20">
                            {/*
                             * Tailwind aspect 클래스에
                             * 의존하지 않고 직접 비율을
                             * 지정합니다.
                             */}
                            <div
                                className="relative w-full overflow-hidden rounded-2xl bg-black"
                                style={{
                                    aspectRatio:
                                        "16 / 9",
                                }}
                            >
                                {/*
                                 * Animation ON
                                 *
                                 * 카드 MP4
                                 */}
                                {animationEnabled &&
                                    cardVideoSrc ? (
                                    <video
                                        ref={
                                            cardVideoRef
                                        }
                                        key={
                                            cardVideoSrc
                                        }
                                        src={
                                            cardVideoSrc
                                        }
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        preload="auto"
                                        poster={
                                            staticImageSrc
                                        }
                                        onCanPlay={(
                                            event,
                                        ) => {
                                            const video =
                                                event.currentTarget;

                                            video.muted =
                                                true;

                                            void video
                                                .play()
                                                .catch(
                                                    () => { },
                                                );
                                        }}
                                        style={{
                                            position:
                                                "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit:
                                                "contain",
                                            display:
                                                "block",
                                        }}
                                    />
                                ) : (
                                    /*
                                     * Animation OFF
                                     *
                                     * 정적 WebP
                                     */
                                    <img
                                        src={
                                            staticImageSrc
                                        }
                                        alt={
                                            card.name
                                        }
                                        style={{
                                            position:
                                                "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit:
                                                "contain",
                                            display:
                                                "block",
                                        }}
                                    />
                                )}

                                {/*
                                 * Signature
                                 *
                                 * 원본 사이트처럼 video는 숨기고
                                 * canvas에 alpha를 복원해서 표시합니다.
                                 */}
                                {signatureVideoSources.length > 0 && (
                                    <video
                                        ref={signatureVideoRef}
                                        key={signatureSourceKey}
                                        preload="auto"
                                        playsInline
                                        muted
                                        crossOrigin="anonymous"
                                        disablePictureInPicture
                                        style={{
                                            position: "absolute",
                                            width: "1px",
                                            height: "1px",
                                            opacity: 0,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {signatureVideoSources.map(
                                            (source) => (
                                                <source
                                                    key={`${source.src}-${source.type}`}
                                                    src={source.src}
                                                    type={source.type}
                                                />
                                            ),
                                        )}
                                    </video>
                                )}

                                <canvas
                                    ref={signatureCanvasRef}
                                    width={1280}
                                    height={720}
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: 10,
                                        width: "100%",
                                        height: "100%",
                                        display: signatureEnabled
                                            ? "block"
                                            : "none",
                                        pointerEvents: "none",
                                    }}
                                />
                            </div>
                        </div>

                        {/* 영상 컨트롤 */}
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setAnimationEnabled(
                                        (
                                            value,
                                        ) =>
                                            !value,
                                    );
                                }}
                                className={[
                                    "rounded-xl border px-4 py-3 text-sm font-bold transition",

                                    animationEnabled
                                        ? "border-blue-400/40 bg-blue-500/20 text-blue-200"
                                        : "border-white/10 bg-white/5 text-slate-400",
                                ].join(" ")}
                            >
                                애니메이션{" "}
                                {animationEnabled
                                    ? "ON"
                                    : "OFF"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setSignatureEnabled(
                                        (
                                            value,
                                        ) =>
                                            !value,
                                    );
                                }}
                                disabled={
                                    card.media
                                        .signatureVideo
                                        .length === 0
                                }
                                className={[
                                    "rounded-xl border px-4 py-3 text-sm font-bold transition",

                                    card.media
                                        .signatureVideo
                                        .length === 0
                                        ? "cursor-not-allowed border-white/5 bg-white/[0.03] text-slate-600"
                                        : signatureEnabled
                                            ? "border-purple-400/40 bg-purple-500/20 text-purple-200"
                                            : "border-white/10 bg-white/5 text-slate-400",
                                ].join(" ")}
                            >
                                사인{" "}
                                {card.media
                                    .signatureVideo
                                    .length === 0
                                    ? "없음"
                                    : signatureEnabled
                                        ? "ON"
                                        : "OFF"}
                            </button>
                        </div>
                    </div>

                    {/* 정보 */}
                    <div className="rounded-3xl border border-white/10 bg-[#0c2452] p-6 md:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <div className="mb-3">
                                    <Stars
                                        rarity={
                                            card.rarity
                                        }
                                    />
                                </div>

                                <h2 className="text-2xl font-black md:text-3xl">
                                    {card.name}
                                </h2>

                                <p className="mt-2 text-slate-400">
                                    {
                                        card.characterName
                                    }
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
                                max={
                                    card.maxLevel
                                }
                                value={level}
                                onChange={(
                                    event,
                                ) =>
                                    setLevel(
                                        Number(
                                            event
                                                .target
                                                .value,
                                        ),
                                    )
                                }
                                className="w-full accent-blue-500"
                            />

                            <div className="mt-2 flex justify-between text-xs text-slate-500">
                                <span>
                                    Lv 1
                                </span>

                                <span>
                                    Lv{" "}
                                    {
                                        card.maxLevel
                                    }
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
                                    {
                                        card.maxPotential
                                    }
                                </span>
                            </div>

                            <div className="grid grid-cols-6 gap-2">
                                {Array.from(
                                    {
                                        length:
                                            card.maxPotential +
                                            1,
                                    },
                                    (
                                        _,
                                        index,
                                    ) => (
                                        <button
                                            key={
                                                index
                                            }
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
                                            {
                                                index
                                            }
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>

                        {/* 현재 개화 보너스 */}
                        <div className="mt-8 rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-purple-300">
                                현재 개화 스탯
                                보너스
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
                            value={
                                current.sense
                            }
                            description="센스"
                        />

                        <StatBox
                            title="TOTAL"
                            value={
                                current.total
                            }
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
                            개화 단계별 잠재력
                            효과
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
                            현재 개화 상태가 적용된
                            스킬 레벨
                        </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <SkillBox
                            title="패시브 스킬"
                            level={
                                current
                                    .passiveSkill
                                    .level
                            }
                            description={
                                current
                                    .passiveSkill
                                    .description
                            }
                        />

                        <SkillBox
                            title="액티브 스킬"
                            level={
                                current
                                    .activeSkill
                                    .level
                            }
                            description={
                                current
                                    .activeSkill
                                    .description
                            }
                        />

                        <SkillBox
                            title="스페셜 스킬"
                            level={
                                current
                                    .specialSkill
                                    .level
                            }
                            description={
                                current
                                    .specialSkill
                                    .description
                            }
                        />

                        {card.outfitSkill && (
                            <SkillBox
                                title={`의상 스킬 · ${card.outfitSkill.name}`}
                                description={
                                    card
                                        .outfitSkill
                                        .description
                                }
                            />
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}