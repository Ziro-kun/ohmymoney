import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AnalysisService } from '../../src/services/AnalysisService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

// --- Premium Donut Chart (Pure View Implementation via Clipping) ---
const Slice = ({ size, angle, rotation, color }: { size: number, angle: number, rotation: number, color: string }) => {
  if (angle <= 0) return null;
  
  // For angles > 180, we split into two segments
  if (angle > 180) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <Slice size={size} angle={180} rotation={rotation} color={color} />
        <Slice size={size} angle={angle - 180} rotation={rotation + 180} color={color} />
      </View>
    );
  }

  return (
    <View 
      style={{
        position: 'absolute',
        width: size,
        height: size,
        transform: [{ rotate: `${rotation}deg` }],
      }}
    >
      <View
        style={{
          width: size / 2,
          height: size,
          overflow: 'hidden',
          left: size / 2,
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            left: -size / 2,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ rotate: `${angle - 180}deg` }],
          }}
        />
      </View>
    </View>
  );
};

const DonutChart = ({ data, total, colors }: { data: any[], total: number, colors: any }) => {
  const size = 240; // Increased size for a more premium look
  let currentRotation = 0;

  return (
    <View style={styles.donutContainer}>
      <View style={[styles.donutInner, { width: size, height: size }]}>
        {data.map((stat, i) => {
          const angle = stat.percentage * 3.6;
          const rotation = currentRotation;
          currentRotation += angle;
          return <Slice key={stat.category} size={size} angle={angle} rotation={rotation} color={stat.color} />;
        })}
        {/* Center Hole: Truly hollowed out by using main background color */}
        <View style={[styles.donutHole, { backgroundColor: colors.bg }]}>
          <Text style={[styles.donutTotalLabel, { color: colors.accent, fontWeight: '800' }]}>총 지출액</Text>
          <Text style={[styles.donutTotalValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {total.toLocaleString()}원
          </Text>
        </View>
      </View>
      
      {/* Legend with better spacing and contrast */}
      <View style={styles.donutLegendBelow}>
        {data.map((stat) => (
          <View key={stat.category} style={styles.legendRecord}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendDot, { backgroundColor: stat.color }]} />
              <Text style={[styles.legendLabelLarge, { color: colors.text }]}>{stat.category}</Text>
            </View>
            <View style={styles.legendRight}>
              <Text style={[styles.legendAmountLarge, { color: colors.text }]}>{stat.amount.toLocaleString()}원</Text>
              <Text style={[styles.legendPercLarge, { color: colors.textMuted }]}>{stat.percentage.toFixed(0)}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// --- Multi-colored Stacked Bar Chart ---
const StackedTrendChart = ({ labels, categoryBreakdown, colors, isDark }: { labels: string[], categoryBreakdown: any[], colors: any, isDark: boolean }) => {
  const maxTotal = useMemo(() => {
    const totals = categoryBreakdown.map(month => 
      Object.values(month).reduce((s: number, a: any) => s + (a as number), 0)
    );
    return Math.max(...totals, 1);
  }, [categoryBreakdown]);

  return (
    <View style={styles.trendChartContainer}>
      {labels.map((label, i) => {
        const monthData = categoryBreakdown[i] || {};
        const total = Object.values(monthData).reduce((s: number, a: any) => s + (a as number), 0);
        const cats = Object.entries(monthData)
          .filter(([_, v]) => (v as number) > 0)
          .sort((a,b) => (b[1] as number) - (a[1] as number));
        
        const barHeight = (total / maxTotal) * 150;

        return (
          <View key={`${label}-${i}`} style={styles.trendColumn}>
            <View style={styles.trendBarContainer}>
              {total > 0 ? (
                <View style={[styles.stackedBar, { height: Math.max(barHeight, 8), backgroundColor: colors.fg + '10' }]}>
                  {cats.map(([cat, val]) => {
                    const heightPerc = ((val as number) / total) * 100;
                    return (
                      <View 
                        key={cat} 
                        style={{ 
                          width: '100%', 
                          height: `${heightPerc}%`, 
                          backgroundColor: AnalysisService.getCategoryColor(cat),
                        }} 
                      />
                    );
                  })}
                </View>
              ) : (
                <View style={[styles.stackedBarEmpty, { height: 4, width: 12, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]} />
              )}
            </View>
            <Text style={[styles.trendLabel, { color: colors.textMuted }]}>{label}</Text>
          </View>
        );
      })}
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
        colors={[isDark ? 'rgba(77, 150, 255, 0.12)' : 'rgba(77, 150, 255, 0.06)', 'transparent']}
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

      {/* Consumption Pattern Section: Donut Chart Hero */}
      <View style={[styles.section, { backgroundColor: colors.card, alignItems: 'center' }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, width: '100%' }]}>어디에 가장 많이 썼나요?</Text>
        {categoryStats.length > 0 ? (
          <DonutChart data={categoryStats} total={totalExpense} colors={colors} />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="pie-chart-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>지출 내역이 없습니다.</Text>
          </View>
        )}
      </View>

      {/* Trend Section: Multi-colored Stacked Bars */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>월별 지출 추이 (항목별)</Text>
        <StackedTrendChart 
          labels={trendData.labels} 
          categoryBreakdown={trendData.categoryBreakdown} 
          colors={colors} 
          isDark={isDark}
        />
        <View style={styles.trendLegend}>
          {categoryStats.slice(0, 5).map(stat => (
            <View key={stat.category} style={styles.trendLegendItem}>
              <View style={[styles.legendDotSmall, { backgroundColor: stat.color }]} />
              <Text style={[styles.trendLegendText, { color: colors.textMuted }]}>{stat.category}</Text>
            </View>
          ))}
        </View>
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
  header: { marginTop: 80, paddingHorizontal: 24, marginBottom: 12 },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5 },
  subtitle: { fontSize: 16, marginTop: 6, opacity: 0.7, fontWeight: '500' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 24, gap: 10 },
  filterButton: { flex: 1, paddingVertical: 12, borderRadius: 18, alignItems: 'center' },
  filterText: { fontWeight: '800', fontSize: 14 },
  section: { marginHorizontal: 24, padding: 24, borderRadius: 32, marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 24, letterSpacing: -0.5 },
  
  // Donut Chart Styles
  donutContainer: { alignItems: 'center', width: '100%', marginVertical: 20 },
  donutInner: { alignItems: 'center', justifyContent: 'center', marginBottom: 50 },
  donutHole: { position: 'absolute', width: 170, height: 170, borderRadius: 85, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  donutTotalLabel: { fontSize: 13, marginBottom: 4, letterSpacing: -0.5, textTransform: 'uppercase' },
  donutTotalValue: { fontSize: 26, fontWeight: '900', width: 150, textAlign: 'center', letterSpacing: -1.2 },
  
  donutLegendBelow: { width: '100%', gap: 14, marginTop: 10 },
  legendRecord: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabelLarge: { fontSize: 16, fontWeight: '700' },
  legendAmountLarge: { fontSize: 16, fontWeight: '800' },
  legendPercLarge: { fontSize: 14, fontWeight: '600', width: 40, textAlign: 'right' },
  legendDotSmall: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },

  // Trend Chart Styles
  trendChartContainer: { flexDirection: 'row', height: 200, alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 0 },
  trendColumn: { alignItems: 'center', flex: 1 },
  trendBarContainer: { height: 150, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  stackedBar: { width: 18, borderRadius: 9, overflow: 'hidden' },
  stackedBarEmpty: { width: 12, borderRadius: 2 },
  trendLabel: { fontSize: 11, marginTop: 12, fontWeight: '700' },
  trendLegend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 32, justifyContent: 'center', gap: 16 },
  trendLegendItem: { flexDirection: 'row', alignItems: 'center' },
  trendLegendText: { fontSize: 12, fontWeight: '700' },

  summaryCard: { marginHorizontal: 24, padding: 24, borderRadius: 32, flexDirection: 'row', alignItems: 'center', marginBottom: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 20, fontWeight: '900' },
  divider: { width: 1, height: 40 },
  emptyContainer: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '700' },
  insightCard: { marginHorizontal: 24, padding: 24, borderRadius: 32, flexDirection: 'row', borderWidth: 1, marginBottom: 24 },
  insightContent: { marginLeft: 16, flex: 1 },
  insightTitle: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  insightText: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
});
