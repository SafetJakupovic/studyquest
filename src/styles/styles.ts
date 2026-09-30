import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 60,
        padding: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        width: '100%',
        minHeight: 100,
        padding: 10,
        textAlignVertical: 'top',
        marginBottom: 10,
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
    output: {
        marginTop: 20,
        fontSize: 14,
    },
    card: {
        width: '100%',
        backgroundColor: '#f2f2f2',
        borderRadius: 8,
        padding: 16,
        marginTop: 10,
        minHeight: 120,
    },
    question: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    answer: {
        marginTop: 8,
        fontSize: 15,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
    },
    reviewArea: {
        width: '100%',
        alignItems: 'center',
    },
    counter: {
        fontSize: 14,
        marginTop: 10,
        color: '#555',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10
    },
    chip: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6
    },
    chipSelected: {
        backgroundColor: '#d6eaff',
        borderColor: '#2980b9'
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 15,
        paddingVertical: 8,
        backgroundColor: '#fff8e1',
        borderRadius: 8
    },
    statsText: {
        fontSize: 14,
        fontWeight: '600'
    },
})