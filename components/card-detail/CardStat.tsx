import styles from "./card-detail.module.css";
import { formatNumber } from "./card-detail.utils";

export function StatBox({
    title,
    value,
    description,
}: {
    title: string;
    value: number;
    description: string;
}) {
    return (
        <div className={styles["card-stat"]}>
            <div className={styles["card-stat-label"]}>
                {title}
            </div>

            <div className={styles["card-stat-value"]}>
                {formatNumber(value)}
            </div>

            <div className={styles["card-stat-description"]}>
                {description}
            </div>
        </div>
    );
}
