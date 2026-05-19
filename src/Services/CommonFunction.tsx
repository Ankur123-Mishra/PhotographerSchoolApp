import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet } from "react-native";
import { getDataWithToken } from "./mobile-api";
import { mobile_siteConfig } from "./mobile-siteConfig";



//-------------------------------------------------------- async storage:----------------------------------------------------------------
export const storeDataToAsyncStorage = async (indexName,value) => {
    let incomingData = JSON.stringify(value);
    try {
        await AsyncStorage.setItem(indexName, incomingData);
    } catch (error) {
        console.error("Error storing token:", error);
    }
}
export const getDataFromAsyncStorage = async (indexName) => {
    try {
        var value = await AsyncStorage.getItem(indexName);
        if (value === null) return undefined;
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    } catch (error) {
        console.error("Error reading from AsyncStorage:", error);
    }
}

    export const removeDataFromAsyncStorage = async (indexName) => {
        try {
            var value = await AsyncStorage.removeItem(indexName);
            if (value !== null) {
                return JSON.parse(value);
            }
        } catch (error) {
            console.error("Error storing token:", error);
        }
};

// export const getCurrency=(setCurrency)=>{
//     getDataWithToken({},mobile_siteConfig.getCurrencyType)
//     .then(res => {
//         // console.log("currenvy Type",res.data)
//         setCurrency(res.data)
//     })
// }



const styles = StyleSheet.create({
    // toastText1: {
    //     fontSize: FSize.fs14,
    //     fontWeight: 'bold',
    // },
    // toastText2: {
    //     fontSize: FSize.fs13,
    // },
})