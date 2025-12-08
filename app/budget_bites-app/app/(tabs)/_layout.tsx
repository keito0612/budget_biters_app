import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import MyBanner from "../../components/MyBanner";
import { CustomHeader } from "../../components/custom/CustomHeader";
import { BannerAdSize } from "react-native-google-mobile-ads";
import { Platform, Dimensions } from 'react-native';

export default function TabLayout() {

    const { height, width } = Dimensions.get('window');
    // 画面高さが700px未満のiOSデバイスをSE系と見なす
    const IS_IPHONE_SE_2_3 = Platform.OS === 'ios' && height < 700;

    // SE専用のbottom値
    const SE_BOTTOM_VALUE = 48;
    // その他のデバイスのbottom値
    const DEFAULT_BOTTOM_VALUE = 80;

    // 現在のデバイスに応じた bottom の値を計算
    const bannerBottomValue = IS_IPHONE_SE_2_3 ? SE_BOTTOM_VALUE : DEFAULT_BOTTOM_VALUE;

    return (
        <View style={staticStyles.container}>
            <Tabs
                // ... (Tabsのオプションは省略)
                screenOptions={{
                    headerShown: true,
                    tabBarActiveTintColor: "#007AFF",
                    tabBarInactiveTintColor: "#aaa",
                    tabBarStyle: { backgroundColor: "#fff" },
                }}
            >
                {/* ... (Tabs.Screen の定義は省略) */}
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "ホーム",
                        header: () => <CustomHeader title={"ホーム"} />,
                        tabBarIcon: (props) => (
                            <Ionicons name="home-outline" size={20} color={props.color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="calendar"
                    options={{
                        title: "献立カレンダー",
                        tabBarIcon: (props) => (
                            <Ionicons name="calendar-outline" size={20} color={props.color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="setting"
                    options={{
                        title: "設定",
                        tabBarIcon: (props) => (
                            <Ionicons name="settings" size={20} color={props.color} />
                        ),
                    }}
                />
            </Tabs>
            <View
                style={[
                    staticStyles.baseBannerContainer,
                    { bottom: bannerBottomValue }
                ]}
            >
                <MyBanner size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
            </View>
        </View>
    );
}

const staticStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // bannerContainerから動的なbottomプロパティを削除
    baseBannerContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
});
