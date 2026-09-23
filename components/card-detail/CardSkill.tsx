import styles from "./card-detail.module.css";

export function SkillBox({
    title,
    level,
    description,
}: {
    title: string;
    level?: number;
    description: string;
}) {
    return (
        <div className={styles["card-skill"]}>
            <div className={styles["card-skill-header"]}>
                <h3 className={styles["card-skill-title"]}>
                    {title}
                </h3>

                {level !== undefined && (
                    <span className={styles["card-skill-level"]}>
                        Lv {level}
                    </span>
                )}
            </div>

            <p className={styles["card-skill-description"]}>
                {description || "설명이 없습니다."}
            </p>
        </div>
    );
}
