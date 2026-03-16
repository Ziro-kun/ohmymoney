import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AnalysisService } from '../../src/services/AnalysisService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

// --- Custom Pie Chart (Pure View Implementation) ---
const PieChart = ({ data, total, colors }: { data: any[], total: number, colors: any }) => {
  const size = 180;
  
  return (
    <View style={styles.pieContainer}>
      <View style={[styles.pieBase, { width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(120,120,120,0.1)', overflow: 'hidden' }]}>
        {/* Circular Segments (Mockup using segments) */}
        {data.length > 0 ? (
          data.slice(0, 5).map((stat, i) => {
            // High-fidelity Pie Segment Representation
            // Using a stack of semicircles with rotations
            const rotation = data.slice(0, i).reduce((acc, curr) => acc + (curr.percentage * 3.6), 0);
            const segmentAngle = stat.percentage * 3.6;
            
            return (
              <View 
                key={stat.category} 
                style={[
                  styles.pieSegment, 
                  { 
                    width: size, 
                    height: size, 
                    borderRadius: size/2, 
                    backgroundColor: stat.color,
                    position: 'absolute',
                    opacity: 1 - (i * 0.05),
                    transform: [
                      { rotate: `${rotation}deg` },
                      { scale: 1.1 } // Slighting overlap to prevent gaps
                    ]
                  }
                ]} 
              />
            );
          })
        ) : (
          <View style={[styles.pieInner, { width: size, height: size, borderRadius: size/2, backgroundColor: 'rgba(120,120,120,0.1)' }]} />
        )}
        
        {/* Subtle Overlay to give it a "Pie" feel with segments if we can't do perfect masking */}
        <View style={[styles.pieOverlay, { width: size, height: size, borderRadius: size/2, borderColor: colors.card, borderWidth: 2, position: 'absolute' }]} />
      </View>
      
      <View style={styles.pieLegend}>
        {data.map((stat) => (
          <View key={stat.category} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: stat.color }]} />
            <Text style={[styles.legendLabel, { color: colors.text }]}>{stat.category}</Text>
            <Text style={[styles.legendValue, { color: colors.textMuted }]}>{stat.percentage.toFixed(0)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// --- Multi-colored Stacked Bar Chart ---
const StackedTrendChart = ({ labels, categoryBreakdown, colors }: { labels: string[], categoryBreakdown: any[], colors: any }) => {
  // Find max total for scaling
  const maxTotal = Math.max(...categoryBreakdown.map(month => 
    Object.values(month).reduce((s: number, a: any) => s + (a as number), 0)
  ), 1);

  return (
    <View style={styles.trendChartContainer}>
      {labels.map((label, i) => {
        const monthData = categoryBreakdown[i];
        const total = Object.values(monthData).reduce((s: number, a: any) => s + (a as number), 0);
        const cats = Object.entries(monthData).sort((a,b) => (b[1] as number) - (a[1] as number));
        
        return (
          <View key={label} style={styles.trendColumn}>
            <View style={styles.trendBarContainer}>
              <View style={[styles.stackedBar, { height: `${(total/maxTotal) * 100}%` }]}>
                {cats.map(([cat, val], idx) => {
                  const heightPerc = ((val as number) / total) * 100;
                  // Use a helper or direct mapping for colors
                  const catColor = AnalysisService.getCategoryColor(cat);
                  return (
                    <View 
                      key={cat} 
                      style={{ 
                        width: '100%', 
                        height: `${heightPerc}%`, 
                        backgroundColor: catColor,
                        borderTopLeftRadius: idx === 0 ? 8 : 0,
                        borderTopRightRadius: idx === 0 ? 8 : 0,
                        borderBottomLeftRadius: idx === cats.length - 1 ? 8 : 0,
                        borderBottomRightRadius: idx === cats.length - 1 ? 8 : 0,
                      }} 
                    />
                  );
                })}
              </View>
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

      {/* Consumption Pattern Section: Pie Chart replacement */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>어디에 가장 많이 썼나요?</Text>
        {categoryStats.length > 0 ? (
          <PieChart data={categoryStats} total={totalExpense} colors={colors} />
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
  
  // Pie Styles
  pieContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  pieBase: { alignItems: 'center', justifyContent: 'center' },
  pieSegment: { position: 'absolute' },
  pieInner: { alignItems: 'center', justifyContent: 'center' },
  pieOverlay: { zIndex: 20 },
  pieLegend: { flex: 1, marginLeft: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendDotSmall: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  legendLabel: { fontSize: 14, fontWeight: '700', flex: 1 },
  legendValue: { fontSize: 13, fontWeight: '600' },

  // Trend Chart Styles
  trendChartContainer: { flexDirection: 'row', height: 200, alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 5 },
  trendColumn: { alignItems: 'center', flex: 1 },
  trendBarContainer: { height: 150, width: 20, justifyContent: 'flex-end' },
  stackedBar: { width: '100%', borderRadius: 8, overflow: 'hidden' },
  trendLabel: { fontSize: 13, marginTop: 12, fontWeight: '700' },
  trendLegend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, justifyContent: 'center', gap: 12 },
  trendLegendItem: { flexDirection: 'row', alignItems: 'center' },
  trendLegendText: { fontSize: 12, fontWeight: '600' },

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
