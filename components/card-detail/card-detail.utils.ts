export function toLocalAssetUrl(src: string): string {
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

export function formatNumber(value: number) {
    return value.toLocaleString("ko-KR");
}
