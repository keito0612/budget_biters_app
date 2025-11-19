import React from 'react';
import { View } from 'react-native';
import Dialog from 'react-native-dialog';
import { AlertType } from '../types/types';
import { MaterialIcons } from '@expo/vector-icons'; // ← 追加（Expoなら標準）

interface AlertDialogProps {
    title: string;
    message?: string;
    visible: boolean;
    alertType: AlertType;
    cancelClick: () => void;
    onPress: () => Promise<void> | void;
}

export const AlertDialog = ({
    title,
    message,
    visible,
    alertType,
    cancelClick,
    onPress
}: AlertDialogProps) => {

    const isWarning = alertType === 'warning' || alertType === 'error';

    return (
        visible && (
            <View>
                <Dialog.Container visible={visible}>

                    {/* 🔥 アイコンを一番上に配置 */}

                    {/* タイトル */}
                    <Dialog.Title>
                        {title}
                    </Dialog.Title>
                    {/* 説明文 */}
                    <Dialog.Description style={{ color: isWarning ? 'red' : 'black' }}>
                        {message}
                    </Dialog.Description>

                    {/* ボタン */}
                    <Dialog.Button label="はい" onPress={() => onPress()} />
                    {alertType === 'warning' && (
                        <Dialog.Button label="いいえ" color="red" onPress={cancelClick} />
                    )}

                </Dialog.Container>
            </View>
        )
    );
};
