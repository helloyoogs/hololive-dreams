import { notFound } from "next/navigation";
import { getCardDetail } from "@/lib/card-detail";
import CardDetailClient from "@/components/card-detail/CardDetailClient";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function CardDetailPage({
    params,
}: PageProps) {
    const { id } = await params;

    try {
        const card = getCardDetail(id);

        return (
            <CardDetailClient card={card} />
        );
    } catch (error) {
        console.error(
            "카드 상세 정보를 불러오지 못했습니다:",
            error,
        );

        notFound();
    }
}