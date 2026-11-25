import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GuideSpot } from '../../onboarding/guide-spot';
import { Icon } from '../../booking/components/booking-icon';
import { Brand } from '../../shared/brand';
import { PressableScale } from '../../shared/components/pressable-scale';
import { Text, TextInput } from '../../shared/components/text';
import { useShopLocator } from '../hooks/use-shop-locator';
import { distanceLabel } from '../models/route-labels';
import { paginateShops } from '../models/shop-pagination';
import { LocationIcon } from './location-icon';
import { locatorStyles as s } from './shop-locator.styles';

type Props = { shops: { id: string; name: string; address: string; phone?: string }[]; onBook: (index: number) => void };
export default function ShopLocator({ shops, onBook }: Props) {
  const { status, message, canAskAgain, locate, area, setArea, selected, select, clearSelection, places, mapError, position, isLocating, openSettings } = useShopLocator();
  const [requestedPage, setRequestedPage] = useState(0);
  const { page, pages, items } = paginateShops(places, requestedPage);
  const locatedCount = places.filter(place => place.coordinates).length;
  return <View style={s.container}>
    <GuideSpot name="shops-position" order={1} text="Activez la localisation pour classer les boutiques dont les coordonnées sont connues par distance à vol d’oiseau." style={s.locationCard}>
      <View style={s.locationIcon}><LocationIcon /></View>
      <View style={s.locationCopy}>
        <Text style={s.locationTitle}>{position ? 'Position activée' : 'Près de vous'}</Text>
        <Text style={s.locationText}>{position ? 'Distances à vol d’oiseau affichées.' : 'Activez votre position pour voir les distances.'}</Text>
      </View>
      <PressableScale disabled={isLocating} onPress={() => void locate()} style={s.locateButton} accessibilityRole="button" accessibilityLabel={position ? 'Actualiser ma position' : 'Activer ma position'}>
        {isLocating ? <ActivityIndicator size="small" color={Brand.orange} /> : <LocationIcon size={16} />}
        <Text style={s.orangeText}>{isLocating ? 'Recherche…' : position ? 'Actualiser' : 'Me localiser'}</Text>
      </PressableScale>
    </GuideSpot>
    {!!message && <View style={s.notice}><Text accessibilityRole="alert" style={s.noticeText}>{message}</Text>{status === 'denied' && !canAskAgain && (Platform.OS === 'web' ? <Text style={s.small}>Autorisez la localisation dans les paramètres du navigateur.</Text> : <Pressable accessibilityRole="button" onPress={openSettings} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={s.orangeText}>Ouvrir les paramètres</Text></Pressable>)}</View>}
    <GuideSpot name="shops-search" order={2} text="Recherchez une boutique du catalogue par nom ou quartier. La liste se met à jour pendant la saisie." style={s.searchRow}>
      <Icon name="search" size={19} color={Brand.textTertiary} />
      <TextInput style={s.input} value={area} onChangeText={value => { setRequestedPage(0); setArea(value); }} maxLength={120} placeholder="Nom ou quartier" accessibilityLabel="Rechercher une boutique" returnKeyType="search" />
      {!!area && <Pressable onPress={() => { setRequestedPage(0); setArea(''); }} accessibilityRole="button" accessibilityLabel="Effacer la recherche" style={s.clear}><Icon name="close" size={18} color={Brand.textTertiary} /></Pressable>}
    </GuideSpot>
    <GuideSpot name="shops-map" order={3} text="Ouvrez la carte pour afficher votre position et les boutiques géolocalisées, puis calculer un trajet." style={s.mapCard}>
      <View style={s.mapIcon}><Icon name="map" size={22} color={Brand.orange} /></View>
      <View style={s.mapCopy}><Text style={s.mapTitle}>Explorer la carte</Text><Text style={s.small}>Position, boutiques, itinéraires</Text></View>
      <PressableScale accessibilityRole="button" onPress={() => router.push('/localisation')} style={s.mapButton}><Text style={s.mapButtonText}>Ouvrir</Text><Icon name="arrow" size={16} color="white" /></PressableScale>
    </GuideSpot>
    {!!mapError && <View style={s.notice}><Text accessibilityRole="alert" style={s.noticeText}>{mapError}</Text></View>}
    <View style={s.listHeading}>
      <Text accessibilityRole="header" style={s.sectionTitle}>Nos boutiques</Text>
      <Text style={s.small}>{places.length} résultat{places.length === 1 ? '' : 's'}{position && locatedCount ? ' · triés par distance' : ''}</Text>
    </View>
    {!places.length ? <View style={s.empty}>
      <Icon name="search" size={28} color={Brand.orange} />
      <Text style={s.cardTitle}>Aucune boutique trouvée</Text>
      <Text style={s.small}>Essayez un autre nom ou quartier.</Text>
      {!!area && <Pressable onPress={() => { setRequestedPage(0); setArea(''); }} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}><Text style={s.orangeText}>Effacer la recherche</Text></Pressable>}
    </View> : <View style={s.shopList}>{items.map((place, i) => {
      const index = shops.findIndex(shop => shop.id === place.shopId);
      const active = selected?.shopId === place.shopId;
      return <Animated.View key={place.shopId} entering={FadeInDown.duration(380).delay(i * 50)} style={[s.shopCard, active && s.shopCardActive]}>
        <Pressable onPress={() => active ? clearSelection() : select(place)} accessibilityRole="button" accessibilityState={{ expanded: active }} accessibilityLabel={`${place.name}, ${place.address}`} style={s.shopTop}>
          <View style={[s.shopIcon, active && s.shopIconActive]}><Icon name="shop" size={21} color={active ? Brand.white : Brand.orange} /></View>
          <View style={s.shopCopy}>
            <View style={s.titleRow}>
              <Text style={s.shopTitle}>{place.name}</Text>
              {place.straightLineMeters != null && <Text style={s.distance}>{distanceLabel(place.straightLineMeters)}</Text>}
            </View>
            <Text style={s.address} numberOfLines={2}>{place.address}</Text>
            {!place.coordinates && <Text style={s.caption}>Position non renseignée</Text>}
          </View>
          <View style={{ transform: [{ rotate: active ? '-90deg' : '90deg' }] }}><Icon name="arrow" size={16} color={Brand.textTertiary} /></View>
        </Pressable>
        {active && <View style={s.actions}>
          {!place.coordinates && <Text style={s.actionHint}>Les coordonnées de cette boutique ne sont pas encore disponibles.</Text>}
          <View style={s.actionRow}>
            {place.coordinates && <PressableScale onPress={() => router.push({ pathname: '/localisation', params: { shopId: place.shopId } })} accessibilityRole="button" style={s.outlineButton}><Icon name="map" size={17} color={Brand.orangeDark} /><Text style={s.outlineText}>Carte</Text></PressableScale>}
            {!!shops[index]?.phone && <PressableScale onPress={() => void Linking.openURL(`tel:${shops[index].phone!.replace(/s+/g, '')}`).catch(() => {})} accessibilityRole="button" accessibilityLabel={`Appeler ${place.name}`} style={s.outlineButton}><Icon name="phone" size={17} color={Brand.orangeDark} /><Text style={s.outlineText}>Appeler</Text></PressableScale>}{index >= 0 && <PressableScale onPress={() => onBook(index)} accessibilityRole="button" style={s.bookingButton}><Icon name="calendar" size={17} color="white" /><Text style={s.bookingText}>Réserver ici</Text></PressableScale>}
          </View>
        </View>}
      </Animated.View>;
    })}</View>}
    {pages > 1 && <View style={s.pagination}>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: page === 0 }} disabled={page === 0} onPress={() => { clearSelection(); setRequestedPage(page - 1); }} style={[s.pageButton, page === 0 && s.pageDisabled]}><Text style={s.pageText}>Précédent</Text></Pressable>
      <Text style={s.pageLabel}>{page + 1} / {pages}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: page === pages - 1 }} disabled={page === pages - 1} onPress={() => { clearSelection(); setRequestedPage(page + 1); }} style={[s.pageButton, page === pages - 1 && s.pageDisabled]}><Text style={s.pageText}>Suivant</Text></Pressable>
    </View>}
    {places.some(place => place.isDemo) && <Text style={s.caption}>Adresses et disponibilités à confirmer avant votre visite.</Text>}
  </View>;
}
