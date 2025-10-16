import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Paragraph, Title } from 'react-native-paper';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>Oops! Something went wrong</Title>
              <Paragraph style={styles.subtitle}>
                The app encountered an unexpected error. Don&apos;t worry, your data is safe.
              </Paragraph>

              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <Paragraph style={styles.errorTitle}>Error Details (Dev Mode):</Paragraph>
                  <Paragraph style={styles.errorMessage}>
                    {this.state.error.toString()}
                  </Paragraph>
                  {this.state.errorInfo && (
                    <Paragraph style={styles.errorStack}>
                      {this.state.errorInfo.componentStack}
                    </Paragraph>
                  )}
                </View>
              )}

              <Button
                mode="contained"
                onPress={this.handleReset}
                style={styles.button}
              >
                Try Again
              </Button>

              <Button
                mode="outlined"
                onPress={() => {
                  // Could add a restart app functionality
                  this.handleReset();
                }}
                style={styles.button}
              >
                Restart App
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#d32f2f',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  errorDetails: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
  },
  errorTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#d32f2f',
  },
  errorMessage: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
    marginBottom: 10,
  },
  errorStack: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#666',
  },
  button: {
    marginTop: 10,
  },
});
