"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Stars } from "./CardStars";
import { StatBox } from "./CardStat";
import { SkillBox } from "./CardSkill";
import { toLocalAssetUrl } from "./card-detail.utils";
import type { CardDetailClientProps } from "./types";
import styles from "./card-detail.module.css";

export default function CardDetailClient({
    card,
}: CardDetailClientProps) {
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
     * 카드 애니메이션의 첫 프레임이 실제 화면에 표시된 뒤
     * 사인을 시작하기 위한 동기화 상태입니다.
     *
     * animation OFF에서는 정적 이미지가 즉시 표시되므로
     * 사인도 독립적으로 바로 시작할 수 있습니다.
     */
    const [
        cardFirstFrameReady,
        setCardFirstFrameReady,
    ] = useState(false);

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

        /*
         * 카드 애니메이션을 새로 켜거나 소스가 바뀌면
         * 사인이 먼저 출발하지 않도록 잠급니다.
         */
        if (animationEnabled && cardVideoSrc) {
            setCardFirstFrameReady(false);
        } else {
            // 정적 이미지 상태에서는 사인을 독립적으로 재생합니다.
            setCardFirstFrameReady(true);
        }

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
     * 사인 영상은 화면에 직접 표시하지 않고 숨겨진 video를
     * 계속 재생하면서 매 프레임 canvas로 합성합니다.
     *
     * 중요:
     * requestVideoFrameCallback은 일부 브라우저에서 영상이 끝난 뒤
     * 다시 재생할 때 콜백 체인이 끊길 수 있으므로 사용하지 않습니다.
     * requestAnimationFrame을 계속 유지하고 ended에서 영상을 수동으로
     * 0초로 되돌려 재생해 사인과 canvas가 함께 확실히 반복됩니다.
     */
    useEffect(() => {
        const video = signatureVideoRef.current;
        const canvas = signatureCanvasRef.current;

        if (!video || !canvas) return;

        const context = canvas.getContext("2d", {
            willReadFrequently: true,
        });

        if (!context) return;

        const clearCanvas = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
        };

        if (
            !signatureEnabled ||
            signatureVideoSources.length === 0
        ) {
            video.pause();
            clearCanvas();
            try {
                video.currentTime = 0;
            } catch {
                // metadata 로드 전에는 currentTime 설정이 실패할 수 있습니다.
            }
            return;
        }

        /*
         * 카드 애니메이션이 ON이면 카드의 첫 프레임이 실제로
         * 표시될 때까지 사인 재생/Canvas 합성을 시작하지 않습니다.
         *
         * 이 조건 때문에:
         *   카드 영상 play -> 첫 프레임 표시 -> 사인 시작
         * 순서가 보장됩니다.
         */
        if (animationEnabled && !cardFirstFrameReady) {
            video.pause();
            clearCanvas();
            try {
                video.currentTime = 0;
            } catch {
                // metadata 로드 전에는 currentTime 설정이 실패할 수 있습니다.
            }
            return;
        }

        const frameCanvas = document.createElement("canvas");
        const frameContext = frameCanvas.getContext("2d", {
            willReadFrequently: true,
        });

        if (!frameContext) return;

        let stopped = false;
        let animationFrameId = 0;
        let restarting = false;

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

            frameContext.clearRect(0, 0, sourceWidth, sourceHeight);
            frameContext.drawImage(
                video,
                0,
                0,
                sourceWidth,
                sourceHeight,
            );

            if (!packedAlpha) {
                context.clearRect(0, 0, sourceWidth, outputHeight);
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

            for (let index = 0; index < colorData.length; index += 4) {
                colorData[index + 3] = maskData[index];
            }

            context.clearRect(0, 0, sourceWidth, outputHeight);
            context.putImageData(color, 0, 0);
        };

        // Canvas 루프는 video의 종료 여부와 관계없이 계속 유지합니다.
        const renderLoop = () => {
            if (stopped) return;
            renderSignatureFrame();
            animationFrameId = requestAnimationFrame(renderLoop);
        };

        const restartVideo = async () => {
            if (stopped || restarting) return;

            restarting = true;
            try {
                // native loop에 의존하지 않고 직접 처음으로 돌립니다.
                video.currentTime = 0;
                await video.play();
            } catch (error) {
                console.error("사인 영상 반복 재생 실패:", error);
            } finally {
                restarting = false;
            }
        };

        const startVideo = async () => {
            try {
                video.muted = true;
                video.defaultMuted = true;
                // ended 이벤트를 확실히 받기 위해 native loop는 끕니다.
                video.loop = false;
                video.currentTime = 0;
                clearCanvas();
                await video.play();
            } catch (error) {
                console.error("사인 영상 자동재생 실패:", error);
            }
        };

        const handleEnded = () => {
            // 마지막 프레임에서 멈추지 않고 즉시 처음부터 다시 재생합니다.
            void restartVideo();
        };

        const handleCanPlay = () => {
            if (video.paused && !stopped) {
                void video.play().catch(() => { });
            }
        };

        video.addEventListener("ended", handleEnded);
        video.addEventListener("canplay", handleCanPlay);

        // Canvas 렌더링 루프는 한 번만 시작합니다.
        renderLoop();

        // source가 바뀌었을 수 있으므로 다시 로드한 뒤 처음부터 재생합니다.
        video.load();

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            void startVideo();
        } else {
            const handleLoadedData = () => {
                void startVideo();
            };
            video.addEventListener("loadeddata", handleLoadedData, {
                once: true,
            });
        }

        return () => {
            stopped = true;
            video.pause();
            video.removeEventListener("ended", handleEnded);
            video.removeEventListener("canplay", handleCanPlay);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [
        signatureEnabled,
        signatureSourceKey,
        signatureVideoSources.length,
        animationEnabled,
        cardFirstFrameReady,
    ]);

    if (!current) {
        return null;
    }

    return (
        <main className="min-h-screen px-4 py-10 text-[#62628e] md:px-8">
            <div className="mx-auto max-w-[1180px]">
                {/* 상단 */}
                <div className="mb-7">
                    <div className="mb-2 text-xs font-bold tracking-[0.12em] text-[#14d0ee]">
                        CARD DETAIL
                    </div>

                    <h1 className="text-3xl font-bold text-[#45456c] md:text-4xl">
                        {card.name}
                    </h1>

                    <p className="mt-2 text-sm text-[#9696ad]">
                        {card.characterName}
                    </p>
                </div>

                {/* 카드 기본 정보 */}
                <section className="grid items-start gap-7 lg:grid-cols-[minmax(0,560px)_minmax(320px,1fr)]">
                    {/* 카드 뷰어 */}
                    <div className="mx-auto w-full max-w-[680px] lg:mx-0">
                        <div className={styles["card-media"]}>
                            {/*
                             * Tailwind aspect 클래스에
                             * 의존하지 않고 직접 비율을
                             * 지정합니다.
                             */}
                            <div
                                className={styles["card-stage"]}
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
                                        onPlaying={(
                                            event,
                                        ) => {
                                            const video =
                                                event.currentTarget;

                                            /*
                                             * playing 이벤트만으로는 사인과 카드가 같은
                                             * 렌더링 틱에 시작할 수 있으므로, 가능하면
                                             * requestVideoFrameCallback으로 실제 첫 프레임
                                             * 표시 직후 사인을 시작합니다.
                                             */
                                            const videoWithFrameCallback =
                                                video as HTMLVideoElement & {
                                                    requestVideoFrameCallback?: (
                                                        callback: () => void,
                                                    ) => number;
                                                };

                                            if (
                                                typeof videoWithFrameCallback
                                                    .requestVideoFrameCallback ===
                                                "function"
                                            ) {
                                                videoWithFrameCallback
                                                    .requestVideoFrameCallback(
                                                        () => {
                                                            setCardFirstFrameReady(
                                                                true,
                                                            );
                                                        },
                                                    );
                                            } else {
                                                requestAnimationFrame(
                                                    () => {
                                                        setCardFirstFrameReady(
                                                            true,
                                                        );
                                                    },
                                                );
                                            }
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
                        <div className="mt-2.5 grid grid-cols-2 gap-2">
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
                                    "rounded-[10px] border px-4 py-2.5 text-xs font-bold transition",

                                    animationEnabled
                                        ? "border-[#a2ecf8] bg-[#f1fcfe] text-[#14d0ee]"
                                        : "border-[#dce8eb] bg-white/80 text-[#9696ad]",
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
                                    "rounded-[10px] border px-4 py-2.5 text-xs font-bold transition",

                                    card.media
                                        .signatureVideo
                                        .length === 0
                                        ? "cursor-not-allowed border-[#e8eeee] bg-white/50 text-[#c1c1cd]"
                                        : signatureEnabled
                                            ? "border-[#a2ecf8] bg-[#f1fcfe] text-[#14d0ee]"
                                            : "border-[#dce8eb] bg-white/80 text-[#9696ad]",
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
                    <div className={styles["card-panel"]}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <div className="mb-3">
                                    <Stars
                                        rarity={
                                            card.rarity
                                        }
                                    />
                                </div>

                                <h2 className="text-2xl font-bold text-[#45456c] md:text-3xl">
                                    {card.name}
                                </h2>

                                <p className="mt-2 text-sm text-[#9696ad]">
                                    {
                                        card.characterName
                                    }
                                </p>
                            </div>

                            <div className="rounded-full border border-[#a2ecf8] bg-[#f2fcfe] px-3 py-1.5 text-xs font-bold text-[#14d0ee]">
                                {card.attribute}
                            </div>
                        </div>

                        {/* 레벨 */}
                        <div className="mt-10">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="font-bold">
                                    레벨
                                </span>

                                <span className="font-bold text-[#14d0ee]">
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
                                className="w-full accent-[#14d0ee]"
                            />

                            <div className="mt-2 flex justify-between text-xs text-[#b1b1c0]">
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

                                <span className="font-bold text-[#14d0ee]">
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
                                                "rounded-[9px] border py-2.5 text-sm font-bold transition",

                                                potential ===
                                                    index
                                                    ? "border-[#14d0ee] bg-[#14d0ee] text-white"
                                                    : "border-[#e5edef] bg-[#f8fbfc] text-[#9a9aae] hover:border-[#a2ecf8] hover:text-[#14d0ee]",
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
                        <div className="mt-7 rounded-xl border border-[#cceff5] bg-[#f2fcfe] p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-[#62628e]">
                                현재 개화 스탯
                                보너스
                            </div>

                            <div className="mt-2 text-2xl font-bold text-[#14d0ee]">
                                +
                                {
                                    current.parameterPercent
                                }
                                %
                            </div>

                            <div className="mt-1 text-xs text-[#aaaabd]">
                                전체 파라미터
                            </div>
                        </div>
                    </div>
                </section>

                {/* 능력치 */}
                <section className="mt-8">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-[#45456c]">
                            능력치
                        </h2>

                        <p className="mt-1 text-xs text-[#aaaabd]">
                            Lv {level} / 개화{" "}
                            {potential}
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

                {/* 스킬 */}
                <section className="mt-10 pb-12">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-[#45456c]">
                            스킬
                        </h2>

                        <p className="mt-1 text-xs text-[#aaaabd]">
                            현재 개화 상태가 적용된
                            스킬 레벨
                        </p>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-3">
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