import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AnalysisService } from '../../src/services/AnalysisService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

// Custom Horizontal Bar Component for Statistics
const StatBar = ({ label, amount, percentage, color, textColor }: { label: string, amount: number, percentage: number, color: string, textColor: string }) => {
  return (
    <View style={styles.statBarContainer}>
      <View style={styles.statBarHeader}>
        <Text style={[styles.statBarLabel, { color: textColor }]}>{label}</Text>
        <Text style={[styles.statBarAmount, { color: textColor }]}>{amount.toLocaleString()}원</Text>
      </View>
      <View style={[styles.statBarTrack, { backgroundColor: 'rgba(120,120,120,0.1)' }]}>
        <View 
          style={[
            styles.statBarFill, 
            { width: `${Math.max(2, percentage)}%`, backgroundColor: color }
          ]} 
        />
      </View>
      <Text style={[styles.statBarPercentage, { color: textColor, opacity: 0.5 }]}>{percentage.toFixed(1)}%</Text>
    </View>
  );
};

export default function StatsScreen() {
  const { colors, isDark } = useAppTheme();
  const { transactions, assets, netWorth } = useFinanceStore();
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const categoryStats = useMemo(() => 
    AnalysisService.getCategoryStats(transactions, period), 
    [transactions, period]
  );

  const trendData = useMemo(() => 
    AnalysisService.getTrendData(transactions, assets),
    [transactions, assets]
  );

  const totalExpense = categoryStats.reduce((sum, s) => sum + s.amount, 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <LinearGradient
        colors={[isDark ? 'rgba(77, 150, 255, 0.15)' : 'rgba(77, 150, 255, 0.08)', 'transparent']}
        style={styles.headerGradient}
      />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>통계 리포트</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {period === 'weekly' ? '최근 7일간' : period === 'monthly' ? '이번 달' : '최근 1년간'}의 소비 리포트입니다.
        </Text>
      </View>

      <View style={styles.filterContainer}>
        {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[
              styles.filterButton,
              { backgroundColor: period === p ? colors.accent : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') }
            ]}
          >
            <Text style={[
              styles.filterText,
              { color: period === p ? '#fff' : colors.textMuted }
            ]}>
              {p === 'weekly' ? '주간' : p === 'monthly' ? '월간' : '연간'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>총 지출</Text>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>{totalExpense.toLocaleString()}원</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>현재 순자산</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{netWorth.toLocaleString()}원</Text>
        </View>
      </View>

      {/* Consumption Pattern Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>어디에 가장 많이 썼나요?</Text>
        {categoryStats.length > 0 ? (
          categoryStats.map((stat) => (
            <StatBar 
              key={stat.category}
              label={stat.category}
              amount={stat.amount}
              percentage={stat.percentage}
              color={stat.color}
              textColor={colors.text}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>지출 내역이 없습니다.</Text>
          </View>
        )}
      </View>

      {/* Trend Section (Simplified Bar Chart) */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>월별 지출 추이</Text>
        <View style={styles.trendChartContainer}>
          {trendData.labels.map((label, i) => {
            const maxValue = Math.max(...trendData.burnRatePoints, 1);
            const heightPerc = (trendData.burnRatePoints[i] / maxValue) * 100;
            return (
              <View key={label} style={styles.trendColumn}>
                <View style={styles.trendValueContainer}>
                   <Text style={[styles.trendValue, { color: colors.text, opacity: 0.7 }]}>
                     {trendData.burnRatePoints[i] > 0 ? (trendData.burnRatePoints[i] / 10000).toFixed(0) + '만' : ''}
                   </Text>
                </View>
                <View style={[styles.trendBarContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                  <View style={[styles.trendBar, { height: `${Math.max(5, heightPerc)}%`, backgroundColor: colors.accent }]} />
                </View>
                <Text style={[styles.trendLabel, { color: colors.textMuted }]}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Insights Section */}
      <View style={[styles.insightCard, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
        <Ionicons name="bulb" size={24} color={colors.accent} />
        <View style={styles.insightContent}>
          <Text style={[styles.insightTitle, { color: colors.accent }]}>소비 인사이트</Text>
          <Text style={[styles.insightText, { color: colors.text }]}>
            {categoryStats.length > 0 
              ? `전체 지출 중 ${categoryStats[0].category} 비중이 ${categoryStats[0].percentage.toFixed(0)}%로 가장 높습니다. 이 항목을 관리하면 자산 목표 달성이 빨라집니다.`
              : "충분한 데이터가 쌓이면 AI가 당신의 소비 패턴을 분석해 드립니다."}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 350 },
  header: { marginTop: 80, paddingHorizontal: 24, marginBottom: 24 },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5 },
  subtitle: { fontSize: 16, marginTop: 6, opacity: 0.7, fontWeight: '500' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 24, gap: 10 },
  filterButton: { flex: 1, paddingVertical: 12, borderRadius: 18, alignItems: 'center' },
  filterText: { fontWeight: '800', fontSize: 14 },
  summaryCard: { marginHorizontal: 24, padding: 24, borderRadius: 32, flexDirection: 'row', alignItems: 'center', marginBottom: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 20, fontWeight: '900' },
  divider: { width: 1, height: 40 },
  section: { marginHorizontal: 24, padding: 24, borderRadius: 32, marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 24, letterSpacing: -0.5 },
  statBarContainer: { marginBottom: 22 },
  statBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statBarLabel: { fontSize: 16, fontWeight: '700' },
  statBarAmount: { fontSize: 16, fontWeight: '600' },
  statBarTrack: { height: 12, borderRadius: 6, overflow: 'hidden' },
  statBarFill: { height: '100%', borderRadius: 6 },
  statBarPercentage: { fontSize: 13, marginTop: 6, textAlign: 'right', fontWeight: '600' },
  trendChartContainer: { flexDirection: 'row', height: 200, alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10 },
  trendColumn: { alignItems: 'center', flex: 1 },
  trendValueContainer: { height: 20, marginBottom: 4 },
  trendValue: { fontSize: 10, fontWeight: '700' },
  trendBarContainer: { height: 140, width: 24, borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden' },
  trendBar: { width: '100%', borderRadius: 12 },
  trendLabel: { fontSize: 13, marginTop: 12, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '700' },
  insightCard: { marginHorizontal: 24, padding: 24, borderRadius: 32, flexDirection: 'row', borderWidth: 1, marginBottom: 24 },
  insightContent: { marginLeft: 16, flex: 1 },
  insightTitle: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  insightText: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
});
