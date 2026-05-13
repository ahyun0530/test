export const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const sortItemsByDistance = (items: any[], userLocation: { lat: number, lng: number } | null) => {
    if (!userLocation) return items;
    return [...items].sort((a, b) => {
        const distA = getDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = getDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distA - distB;
    });
};
