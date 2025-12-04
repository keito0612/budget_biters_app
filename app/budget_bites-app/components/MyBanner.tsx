import React, { useContext } from "react";
import { Platform, View } from "react-native";
import {
    BannerAd,
    BannerAdSize,
} from "react-native-google-mobile-ads";
import { AD_UNIT_IDS } from "../constants/adConfig";
import { TrackingContext } from "../contexts/TrackingContext";


interface Props {
    size: BannerAdSize;
}

export default function MyBanner(props: Props) {
    const unitId = AD_UNIT_IDS.banner
    const nonPersonalizedOnly = useContext(TrackingContext);

    return (
        <BannerAd
            {...props}
            unitId={unitId}
            requestOptions={{ requestNonPersonalizedAdsOnly: !!nonPersonalizedOnly }}
        />
    );
}