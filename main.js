import fetch from 'node-fetch';
import Xray from 'x-ray';

let fetchData = async function () {
    const x = Xray();

    let ukLineUpTabDj = await fetch('https://beatherder.co.uk/line-up?tab=all');
    ukLineUpTabDj = await ukLineUpTabDj.text();

    const titles = await x(ukLineUpTabDj, 'ul.l-grid', ['h3.c-card__title']);
    const metas = await x(ukLineUpTabDj, 'ul.l-grid', ['p.c-card__meta']);
    const artistUrls = await x(ukLineUpTabDj, 'ul.l-grid', ['a@href']);

    // For each artist, fetch their page and get their soundcloud URL and description
    let items = await Promise.all(titles.map(async (name, index) => {
        const response = await fetch(`https://beatherder.co.uk${artistUrls[index]}`);
        const body = await response.text();

        // Attempt to get soundcloud URL and description from artist page
        const urls = artistUrls[index] && response.ok ? await x(body, 'ul.c-icons', ['a.c-icon-box@href']) : [];
        const soundcloud = urls ? urls.find(link => link.includes('soundcloud')) : null;
        const when = artistUrls[index] && response.ok ? await x(body, 'div.p-wysiwyg', 'p.u-text-transform--upper') : null;
        const description = artistUrls[index] && response.ok ? await x(body, 'div.p-wysiwyg', 'div div p') : null;

        return {
            name,
            stage: metas[index],
            when: when ? when : '',
            soundcloud: soundcloud ? soundcloud : '',
            description: description ? description : ''
        };
    }));

    // Build CSV string
    let csv = items.reduce((acc, item) => {
        const { name, stage, when, soundcloud, description } = item;
        const row = [name, stage, when, soundcloud, description].map(cell => `"${cell}"`).join(',');
        acc.push(row);
        return acc;
    }, []).join('\n');

    // Add header row and output CSV
    csv = `"Name","Stage","When","Soundcloud","Description"\n${csv}`;
    console.log(csv);
}

fetchData();