export type Competition = {
  code: string;
  name: string;
  id: number;
};

export const COMPETITIONS: Competition[] = [
  { code: "WC", name: "FIFA World Cup", id: 2000 },
  { code: "CL", name: "UEFA Champions League", id: 2001 },
  { code: "BL1", name: "Bundesliga", id: 2002 },
  { code: "DED", name: "Eredivisie", id: 2003 },
  { code: "BSA", name: "Campeonato Brasileiro Série A", id: 2013 },
  { code: "PD", name: "Primera Division", id: 2014 },
  { code: "FL1", name: "Ligue 1", id: 2015 },
  { code: "ELC", name: "Championship", id: 2016 },
  { code: "PPL", name: "Primeira Liga", id: 2017 },
  { code: "EC", name: "European Championship", id: 2018 },
  { code: "SA", name: "Serie A", id: 2019 },
  { code: "PL", name: "Premier League", id: 2021 },
];
