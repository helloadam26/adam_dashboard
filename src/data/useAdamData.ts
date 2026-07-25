/**
 * Point d'entrée unique pour les données du dashboard.
 * L'implémentation vit dans AdamDataProvider, qui lit les vues `dashboard_*`
 * de Supabase via TanStack Query.
 */
export { useAdamData } from './AdamDataProvider';
