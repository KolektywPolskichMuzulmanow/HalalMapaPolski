import { useEffect, useState } from 'react';
import * as Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXOGFWmvUFgJOYffY8arFpHltMm7HUcU2kfQx4lTz-ydft6PBFqKq6Oci9SdejhmvoAJppEApG3Lfn/pub?gid=1462335138&single=true&output=csv';

export default function usePlaces() {
    const [places, setPlaces] = useState([]);

    useEffect(() => {
        Papa.parse(CSV_URL, {
            download: true,
            header: true,
            complete: (results) => {
                const parsed = results.data.map((item) => ({
                    ...item,
                    Latitude: parseFloat(item.Latitude),
                    Longitude: parseFloat(item.Longitude),
                    Category:
                        item.Category &&
                        item.Category.trim().charAt(0).toUpperCase() +
                        item.Category.trim().slice(1).toLowerCase(),
                }));
                setPlaces(parsed);
            },
        });
    }, []);

    return places;
}
