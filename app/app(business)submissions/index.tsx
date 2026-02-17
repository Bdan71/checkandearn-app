import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";

const API_BASE = "https://checkandearn.com/api";

interface Submission {
  id: string;
  mission_title: string;
  reward_amount: number;
  completion_photo_url: string;
  submitted_text: string;
  submitted_at: string;
  runner_name: string;
}

export default function BusinessSubmissionsScreen() {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubmission();
  }, []);

  const loadSubmission = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/business/submissions/pending`
      );
      const data = await response.json();

      if (!data) {
        setSubmission(null);
        return;
      }

      setSubmission(data);

      const submittedAt = new Date(data.submitted_at).getTime();
      const deadline = submittedAt + 10 * 60 * 1000;
      const remainingSeconds = Math.floor((deadline - Date.now()) / 1000);

      setTimeLeft(remainingSeconds > 0 ? remainingSeconds : 0);
    } catch (error) {
      console.log("Error loading submission:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!submission) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submission]);

  const approve = async () => {
    if (!submission) return;

    Alert.alert(
      "Approve Submission",
      `Release €${submission.reward_amount} reward?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setProcessing(true);
            await fetch(
              `${API_BASE}/business/submissions/${submission.id}/approve`,
              { method: "POST" }
            );
            setProcessing(false);
            loadSubmission();
          },
        },
      ]
    );
  };

  const reject = async () => {
    if (!submission) return;

    setProcessing(true);
    await fetch(
      `${API_BASE}/business/submissions/${submission.id}/reject`,
      { method: "POST" }
    );
    setProcessing(false);
    loadSubmission();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!submission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noData}>No pending submissions</Text>
      </View>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{submission.mission_title}</Text>
      <Text style={styles.reward}>Reward: €{submission.reward_amount}</Text>

      <Text style={styles.timer}>
        ⏱ {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </Text>

      <Image
        source={{ uri: submission.completion_photo_url }}
        style={styles.image}
      />

      <Text style={styles.runner}>Runner: {submission.runner_name}</Text>
      <Text style={styles.text}>{submission.submitted_text}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.approveButton,
            (timeLeft === 0 || processing) && styles.disabled,
          ]}
          onPress={approve}
          disabled={timeLeft === 0 || processing}
        >
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.rejectButton,
            (timeLeft === 0 || processing) && styles.disabled,
          ]}
          onPress={reject}
          disabled={timeLeft === 0 || processing}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  reward: {
    fontSize: 18,
    marginBottom: 10,
  },
  timer: {
    fontSize: 16,
    color: "red",
    marginBottom: 15,
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginBottom: 15,
  },
  runner: {
    fontWeight: "600",
    marginBottom: 5,
  },
  text: {
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 10,
  },
  approveButton: {
    backgroundColor: "#2ecc71",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  noData: {
    fontSize: 16,
    color: "gray",
  },
});
