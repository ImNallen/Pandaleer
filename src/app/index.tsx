import { StyleSheet, Text, View } from 'react-native';

export default function Today() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pandaleer</Text>
      <Text>Development build is running.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFF6E9' },
  title: { fontSize: 32, fontWeight: '700', color: '#3B2418' },
});
