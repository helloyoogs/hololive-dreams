import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;

    try {
        // data/card-detail 폴더에서 요청받은 id에 해당하는 파일 읽기
        const filePath = path.join(process.cwd(), 'data', 'card-detail', `${id}.json`);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Card not found' }, { status: 404 });
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const cardData = JSON.parse(fileContent);

        return NextResponse.json(cardData);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}