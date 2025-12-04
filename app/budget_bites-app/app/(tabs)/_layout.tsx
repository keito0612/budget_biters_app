import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import MyBanner from "../../components/MyBanner";
import { CustomHeader } from "../../components/custom/CustomHeader";
import { BannerAdSize } from "react-native-google-mobile-ads";

export default function TabLayout() {
    return (
        <View style={styles.container}>
            <Tabs
                screenOptions={{
                    headerShown: true,
                    tabBarActiveTintColor: "#007AFF",
                    tabBarInactiveTintColor: "#aaa",
                    tabBarStyle: { backgroundColor: "#fff" },
                }}
            >
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
            <View style={styles.bannerContainer}>
                <MyBanner size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bannerContainer: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
});
