import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';

// --- CONFIGURATION ---
// Remplacez par l'IP de votre PC (ex: http://192.168.1.15:8000)
const API_BASE_URL = 'http://localhost:8000';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [studentCode, setStudentCode] = useState('');

  const [records, setRecords] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- LOGIQUE DE CONNEXION ---
  const handleLogin = async () => {
    if (!email || !studentCode) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, student_code: studentCode }),
      });

      const data = await res.json();
      if (res.ok) {
        setStudent(data);
        setIsLoggedIn(true);
        fetchStudentData(data.id);
      } else {
        Alert.alert('Échec', data.detail || 'Identifiants incorrects');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de contacter le serveur FaceAttend');
    } finally {
      setLoading(false);
    }
  };

  // --- RÉCUPÉRATION DES DONNÉES ---
  const fetchStudentData = async (studentId: string) => {
    try {
      const resRecords = await fetch(`${API_BASE_URL}/api/records?student_id=${studentId}`);
      const resAlerts = await fetch(`${API_BASE_URL}/api/alerts?student_id=${studentId}`);

      setRecords(await resRecords.json());
      setAlerts(await resAlerts.json());
    } catch (e) {
      console.error(e);
    }
  };

  // --- ÉCRAN DE CONNEXION ---
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loginCard}>
          <Text style={styles.loginLogo}>FaceAttend</Text>
          <Text style={styles.loginTagline}>CONNECT</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL PROFESSIONNEL</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: jean.dupont@ecole.com"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CODE ÉTUDIANT</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: STU001"
              placeholderTextColor="#475569"
              value={studentCode}
              onChangeText={setStudentCode}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#020617" />
            ) : (
              <Text style={styles.loginButtonText}>SE CONNECTER</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- DASHBOARD (ÉTUDIANT CONNECTÉ) ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Bonjour,</Text>
          <Text style={styles.studentName}>{student?.full_name}</Text>
        </View>
        <TouchableOpacity onPress={() => setIsLoggedIn(false)} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sortir</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        {/* Alertes */}
        {alerts.length > 0 && (
          <View style={styles.alertSection}>
            <Text style={styles.sectionTitle}>Alertes Absences</Text>
            {alerts.map((a) => (
              <View key={a.id} style={styles.alertItem}>
                <Text style={styles.alertCourse}>{a.course_name}</Text>
                <Text style={styles.alertStatus}>
                  {a.absence_count} absences / {a.threshold} max
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Historique */}
        <Text style={styles.sectionTitle}>Historique Récent</Text>
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.recordItem}>
              <View>
                <Text style={styles.recordCourse}>{item.course_name || 'Session'}</Text>
                <Text style={styles.recordDate}>
                  {new Date(item.marked_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'present' ? styles.bgGreen : styles.bgRed,
                ]}
              >
                <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Login
  loginContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', padding: 30 },
  loginCard: {
    backgroundColor: '#0f172a',
    padding: 40,
    borderRadius: 30,
    borderWeight: 1,
    borderColor: '#1e293b',
  },
  loginLogo: { color: '#00f0ff', fontSize: 32, fontWeight: '900', textAlign: 'center' },
  loginTagline: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 5,
    marginBottom: 40,
  },
  inputGroup: { marginBottom: 25 },
  label: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'black',
    marginBottom: 10,
    letterSpacing: 1,
  },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: 18, borderRadius: 12, fontSize: 16 },
  loginButton: {
    backgroundColor: '#00f0ff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: { color: '#020617', fontWeight: '900', letterSpacing: 2 },

  // Dashboard
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    padding: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  welcomeText: { color: '#64748b', fontSize: 14 },
  studentName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { padding: 10 },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  alertSection: { marginBottom: 30 },
  alertItem: {
    backgroundColor: '#450a0a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  alertCourse: { color: '#fff', fontWeight: 'bold' },
  alertStatus: { color: '#fca5a5', fontSize: 12 },
  recordItem: {
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordCourse: { color: '#fff', fontWeight: 'bold' },
  recordDate: { color: '#64748b', fontSize: 11 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  bgGreen: { backgroundColor: '#065f46' },
  bgRed: { backgroundColor: '#7f1d1d' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});
