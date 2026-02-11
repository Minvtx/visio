import { Inngest } from "inngest";

// Mantenemos el ID original para que coincida con las llaves de Vercel
export const inngest = new Inngest({
    id: "visio",
    name: "Visio Content Studio"
});
