import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { GuideSpot } from '../../onboarding/guide-spot';
import { Icon } from '../../booking/components/booking-icon';
import { useShopLocator } from '../hooks/use-shop-locator';
import { distanceLabel } from '../models/route-labels';
import { paginateShops } from '../models/shop-pagination';
import { LocationIcon } from './location-icon';
import { locatorStyles as s } from './shop-locator.styles';

type Props = { shops: { id: string; name: string; address: string }[]; onBook: (index: number) => void };
export default function ShopLocator({ shops, onBook }: Props) {
  const { status, message, canAskAgain, locate, area, setArea, selected, select, clearSelection, places, mapError, position, isLocating, openSettings } = useShopLocator();
  const [requestedPage, setRequestedPage] = useState(0);
  const { page, pages, items } = paginateShops(places, requestedPage);
  const locatedCount = places.filter(place => place.coordinates).length;
  return <View style={s.container}>
    <GuideSpot name="shops-position" order={1} text="Activez la localisation pour classer les boutiques dont les coordonnées sont connues par distance à vol d’oiseau." style={s.locationCard}>
      <View style={s.locationIcon}><LocationIcon /></View>
      <View style={s.locationCopy}><Text style={s.cardTitle}>{position ? 'Position activée' : 'Des boutiques près de vous'}</Text><Text style={s.small}>{position ? 'Les distances disponibles sont indiquées à vol d’oiseau.' : 'Activez votre position pour voir les distances disponibles.'}</Text></View>
      <Pressable disabled={isLocating} onPress={() => void locate()} style={s.locateButton} accessibilityRole="button" accessibilityLabel={position ? 'Actualiser ma position' : 'Activer ma position'}>
        {isLocating ? <ActivityIndicator size="small" color="#e65b00" /> : <LocationIcon size={16} />}
        <Text style={s.orangeText}>{isLocating ? 'Recherche…' : position ? 'Actualiser' : 'Me localiser'}</Text>
      </Pressable>
    </GuideSpot>
    {!!message && <View style={s.notice}><Text accessibilityRole="alert" style={s.noticeText}>{message}</Text>{status === 'denied' && !canAskAgain && (Platform.OS === 'web' ? <Text style={s.small}>Autorisez la localisation dans les paramètres du navigateur.</Text> : <Pressable onPress={openSettings}><Text style={s.orangeText}>Ouvrir les paramètres</Text></Pressable>)}</View>}
    <GuideSpot name="shops-search" order={2} text="Recherchez une boutique du catalogue par nom ou quartier. La liste se met à jour pendant la saisie." style={s.searchRow}>
      <Icon name="search" size={18} color="#999" /><TextInput style={s.input} value={area} onChangeText={value => { setRequestedPage(0); setArea(value); }} maxLength={120} placeholder="Rechercher un nom ou un quartier" placeholderTextColor="#999" accessibilityLabel="Rechercher une boutique" returnKeyType="search" />
      {!!area && <Pressable onPress={() => { setRequestedPage(0); setArea(''); }} accessibilityRole="button" accessibilityLabel="Effacer la recherche" style={s.clear}><Text style={s.clearText}>×</Text></Pressable>}
    </GuideSpot>
    <GuideSpot name="shops-map" order={3} text="Ouvrez la carte pour afficher votre position et les boutiques géolocalisées, puis calculer un trajet." style={s.mapCard}>
      <View style={s.mapIcon}><Icon name="map" size={22} color="#e65b00" /></View><View style={s.mapCopy}><Text style={s.mapTitle}>Explorer la carte</Text><Text style={s.small}>Position, boutiques et itinéraires</Text></View><Pressable accessibilityRole="button" onPress={() => router.push('/localisation')} style={s.mapButton}><Text style={s.mapButtonText}>Ouvrir</Text><Icon name="arrow" size={16} color="white" /></Pressable>
    </GuideSpot>
    {!!mapError && <View style={s.notice}><Text accessibilityRole="alert" style={s.noticeText}>{mapError}</Text></View>}
    <View style={s.listHeading}><View><Text style={s.sectionTitle}>Nos boutiques</Text><Text style={s.small}>{places.length} résultat{places.length === 1 ? '' : 's'}{position && locatedCount ? ' · triés par distance' : ''}</Text></View></View>
    {!places.length ? <View style={s.empty}><Text style={s.cardTitle}>Aucune boutique trouvée</Text><Text style={s.small}>Essayez un autre nom ou quartier.</Text>{!!area && <Pressable onPress={() => { setRequestedPage(0); setArea(''); }} accessibilityRole="button"><Text style={s.orangeText}>Effacer la recherche</Text></Pressable>}</View> : <View style={s.shopList}>{items.map(place => {
      const index = shops.findIndex(shop => shop.id === place.shopId);
      const active = selected?.shopId === place.shopId;
      return <View key={place.shopId} style={[s.shopCard, active && s.shopCardActive]}>
        <Pressable onPress={() => active ? clearSelection() : select(place)} accessibilityRole="button" accessibilityState={{ expanded: active }} accessibilityLabel={`${place.name}, ${place.address}`} style={s.shopTop}>
          <View style={s.shopIcon}><Icon name="shop" size={20} color="#e65b00" /></View><View style={s.shopCopy}><View style={s.titleRow}><Text style={s.shopTitle}>{place.name}</Text>{place.straightLineMeters != null && <Text style={s.distance}>{distanceLabel(place.straightLineMeters)}</Text>}</View><Text style={s.address}>{place.address}</Text><Text style={s.caption}>{place.coordinates ? 'Position disponible' : 'Position non renseignée'}</Text></View><Text style={s.chevron}>{active ? '⌃' : '›'}</Text>
        </Pressable>
        {active && <View style={s.actions}><Text style={s.actionHint}>{place.coordinates ? 'Consultez le trajet depuis la carte ou préparez votre visite.' : 'Les coordonnées de cette boutique ne sont pas encore disponibles.'}</Text><View style={s.actionRow}>{place.coordinates && <Pressable onPress={() => router.push({ pathname: '/localisation', params: { shopId: place.shopId } })} accessibilityRole="button" style={s.outlineButton}><Text style={s.outlineText}>Voir sur la carte</Text></Pressable>}{index >= 0 && <Pressable onPress={() => onBook(index)} accessibilityRole="button" style={s.bookingButton}><Text style={s.bookingText}>Prendre rendez-vous</Text></Pressable>}</View></View>}
      </View>;
    })}</View>}
    {pages > 1 && <View style={s.pagination}><Pressable accessibilityRole="button" accessibilityState={{ disabled: page === 0 }} disabled={page === 0} onPress={() => { clearSelection(); setRequestedPage(page - 1); }} style={[s.pageButton, page === 0 && s.pageDisabled]}><Text style={s.pageText}>‹  Précédent</Text></Pressable><Text style={s.pageLabel}>Page {page + 1} sur {pages}</Text><Pressable accessibilityRole="button" accessibilityState={{ disabled: page === pages - 1 }} disabled={page === pages - 1} onPress={() => { clearSelection(); setRequestedPage(page + 1); }} style={[s.pageButton, page === pages - 1 && s.pageDisabled]}><Text style={s.pageText}>Suivant  ›</Text></Pressable></View>}
    {places.some(place => place.isDemo) && <Text style={s.caption}>Adresses et disponibilités à confirmer avant votre visite.</Text>}
  </View>;
}
