import React, { useMemo, useState } from "react";
import {
  Layout,
  Menu,
  Typography,
  Space,
  Button,
  Row,
  Col,
  Card,
  Tag,
  Divider,
  Timeline,
  Anchor,
  Form,
  Input,
  message,
  Avatar,
  Tooltip,
} from "antd";
import {
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
  DownloadOutlined,
  CodeOutlined,
  ProjectOutlined,
  TrophyOutlined,
  RocketOutlined,
} from "@ant-design/icons";

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

const SECTION_IDS = {
  home: "home",
  about: "about",
  skills: "skills",
  projects: "projects",
  experience: "experience",
  contact: "contact",
};

export default function App() {
  const [activeKey, setActiveKey] = useState("home");

  // ====== 你只需要改这块数据 ======
  const profile = useMemo(
    () => ({
      name: "Zhengshu Zhang",
      tagline: "USC MS Spatial Data Science • Software Engineer / Data Engineer",
      location: "Los Angeles, CA",
      email: "your_email@example.com",
      github: "https://github.com/forestzs",
      linkedin: "https://www.linkedin.com/in/your-link/",
      resumeUrl: "/resume.pdf", // 你可以把简历 pdf 放到 public/resume.pdf
      avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4", // 换成你自己的
      highlights: [
        "Full-stack: Java / Spring Boot / React / Android (Kotlin)",
        "GeoAI & GIS: GeoPandas / ArcGIS / Spatial analysis",
        "Strong DS&A + Interview ready",
      ],
    }),
    []
  );

  const skills = useMemo(
    () => ({
      Languages: ["Java", "Python", "JavaScript/TypeScript", "Kotlin", "SQL"],
      Backend: ["Spring Boot", "REST API", "Redis", "PostgreSQL", "Docker"],
      Frontend: ["React", "Ant Design", "Vite", "HTML/CSS"],
      Data_Geo: ["GeoPandas", "Rasterio", "ArcGIS Pro/ArcPy", "OSM", "ETL"],
      Cloud: ["AWS (ECR/App Runner)", "GCP basics"],
    }),
    []
  );

  const projects = useMemo(
    () => [
      {
        title: "EasyAI Web App",
        subtitle: "LangChain + Vector Search + PDF Q&A",
        tags: ["RAG", "LangChain", "Chroma/Vector DB", "React", "API"],
        desc:
          "Built an end-to-end app for document Q&A with chunking, embeddings, retrieval, and prompt orchestration. Added evaluation + latency monitoring.",
        links: {
          demo: "",
          github: "https://github.com/your_repo",
        },
        icon: <RocketOutlined />,
      },
      {
        title: "Urban Heat Risk Analyzer",
        subtitle: "LA environmental exposure index",
        tags: ["GeoPandas", "Raster", "Spatial join", "Visualization"],
        desc:
          "Integrated temperature, tree canopy, OSM buildings, and LA GeoHub footprints to compute heat exposure metrics and risk indices for a small area.",
        links: { github: "" },
        icon: <ProjectOutlined />,
      },
      {
        title: "Spotify (Android) Player App",
        subtitle: "MVVM • Retrofit • Repository",
        tags: ["Android", "Kotlin", "MVVM", "Retrofit", "Room/SQLite"],
        desc:
          "Implemented a clean MVVM architecture with repository modules, network layer, and smooth UI navigation via Fragments/Screens.",
        links: { github: "" },
        icon: <CodeOutlined />,
      },
    ],
    []
  );

  const experience = useMemo(
    () => [
      {
        time: "2025",
        title: "Graduate Student • USC Spatial Data Science",
        detail:
          "Coursework & projects in GIS programming, spatial analytics, full-stack dev. Focused on building a strong SWE portfolio with real-world geospatial problems.",
      },
      {
        time: "2024",
        title: "Full-stack Projects",
        detail:
          "Built backend services, dashboards, and Android apps. Practiced scalable API design, database modeling, and deployment workflows.",
      },
    ],
    []
  );

  // ====== 菜单与锚点 ======
  const menuItems = [
    { key: "home", label: "Home" },
    { key: "about", label: "About" },
    { key: "skills", label: "Skills" },
    { key: "projects", label: "Projects" },
    { key: "experience", label: "Experience" },
    { key: "contact", label: "Contact" },
  ];

  const anchorItems = [
    { key: "home", href: `#${SECTION_IDS.home}`, title: "Home" },
    { key: "about", href: `#${SECTION_IDS.about}`, title: "About" },
    { key: "skills", href: `#${SECTION_IDS.skills}`, title: "Skills" },
    { key: "projects", href: `#${SECTION_IDS.projects}`, title: "Projects" },
    { key: "experience", href: `#${SECTION_IDS.experience}`, title: "Experience" },
    { key: "contact", href: `#${SECTION_IDS.contact}`, title: "Contact" },
  ];

  const onMenuClick = ({ key }) => {
    setActiveKey(key);
    const el = document.getElementById(SECTION_IDS[key]);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [form] = Form.useForm();
  const onSubmit = async () => {
    const values = await form.validateFields();
    // 这里你可以接 EmailJS / 后端 API
    message.success("Message sent (demo). You can wire it to EmailJS/API.");
    form.resetFields();
    console.log(values);
  };

  return (
    <Layout className="app">
      <Header className="header">
        <div className="brand">
          <Text className="brandText">{profile.name}</Text>
        </div>

        <div className="menuWrap">
          <Menu
            mode="horizontal"
            selectedKeys={[activeKey]}
            items={menuItems}
            onClick={onMenuClick}
          />
        </div>

        <Space className="headerActions" size={10}>
          <Tooltip title="GitHub">
            <Button
              icon={<GithubOutlined />}
              href={profile.github}
              target="_blank"
            />
          </Tooltip>
          <Tooltip title="LinkedIn">
            <Button
              icon={<LinkedinOutlined />}
              href={profile.linkedin}
              target="_blank"
            />
          </Tooltip>
          <Tooltip title="Email">
            <Button icon={<MailOutlined />} href={`mailto:${profile.email}`} />
          </Tooltip>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            href={profile.resumeUrl}
            target="_blank"
          >
            Resume
          </Button>
        </Space>
      </Header>

      <Content className="content">
        <div className="floatingAnchor">
          <Anchor items={anchorItems} affix={false} />
        </div>

        {/* HERO */}
        <section id={SECTION_IDS.home} className="section hero">
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={16}>
              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                <Title style={{ marginBottom: 0 }}>{profile.tagline}</Title>
                <Text type="secondary">
                  {profile.location} • {profile.email}
                </Text>
                <Paragraph style={{ marginTop: 8 }}>
                  Building clean, reliable software with strong fundamentals.
                  Interested in backend/data engineering and geospatial systems.
                </Paragraph>

                <Space wrap>
                  {profile.highlights.map((h) => (
                    <Tag key={h} icon={<TrophyOutlined />}>
                      {h}
                    </Tag>
                  ))}
                </Space>

                <Space wrap style={{ marginTop: 8 }}>
                  <Button
                    type="primary"
                    icon={<ProjectOutlined />}
                    onClick={() => onMenuClick({ key: "projects" })}
                  >
                    View Projects
                  </Button>
                  <Button
                    icon={<MailOutlined />}
                    onClick={() => onMenuClick({ key: "contact" })}
                  >
                    Contact Me
                  </Button>
                </Space>
              </Space>
            </Col>

            <Col xs={24} md={8} style={{ textAlign: "center" }}>
              <Avatar
                size={180}
                src={profile.avatarUrl}
                style={{ border: "1px solid rgba(0,0,0,0.06)" }}
              />
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">“Simple > clever.”</Text>
              </div>
            </Col>
          </Row>
        </section>

        <Divider />

        {/* ABOUT */}
        <section id={SECTION_IDS.about} className="section">
          <Title level={2}>About</Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={14}>
              <Card>
                <Paragraph>
                  I’m a graduate student in Spatial Data Science at USC. I enjoy
                  shipping practical products: clean APIs, scalable pipelines,
                  and user-friendly UIs. My projects often mix software
                  engineering with geospatial data.
                </Paragraph>
                <Paragraph style={{ marginBottom: 0 }}>
                  Currently looking for SWE internships (Backend/Data/Full-stack).
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={10}>
              <Card title="Quick Links">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button block icon={<GithubOutlined />} href={profile.github} target="_blank">
                    GitHub
                  </Button>
                  <Button block icon={<LinkedinOutlined />} href={profile.linkedin} target="_blank">
                    LinkedIn
                  </Button>
                  <Button block icon={<DownloadOutlined />} href={profile.resumeUrl} target="_blank">
                    Resume
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </section>

        <Divider />

        {/* SKILLS */}
        <section id={SECTION_IDS.skills} className="section">
          <Title level={2}>Skills</Title>
          <Row gutter={[16, 16]}>
            {Object.entries(skills).map(([group, items]) => (
              <Col xs={24} md={12} key={group}>
                <Card title={group.replaceAll("_", " ")}>
                  <Space wrap>
                    {items.map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <Divider />

        {/* PROJECTS */}
        <section id={SECTION_IDS.projects} className="section">
          <Title level={2}>Projects</Title>
          <Row gutter={[16, 16]}>
            {projects.map((p) => (
              <Col xs={24} md={12} lg={8} key={p.title}>
                <Card
                  title={
                    <Space>
                      {p.icon}
                      <span>{p.title}</span>
                    </Space>
                  }
                  extra={
                    <Space>
                      {p.links?.github ? (
                        <Button
                          size="small"
                          icon={<GithubOutlined />}
                          href={p.links.github}
                          target="_blank"
                        />
                      ) : null}
                    </Space>
                  }
                  hoverable
                >
                  <Text type="secondary">{p.subtitle}</Text>
                  <Paragraph style={{ marginTop: 10 }}>{p.desc}</Paragraph>
                  <Space wrap>
                    {p.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <Divider />

        {/* EXPERIENCE */}
        <section id={SECTION_IDS.experience} className="section">
          <Title level={2}>Experience</Title>
          <Card>
            <Timeline
              items={experience.map((e) => ({
                label: e.time,
                children: (
                  <div>
                    <Text strong>{e.title}</Text>
                    <div style={{ marginTop: 6 }}>
                      <Text type="secondary">{e.detail}</Text>
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </section>

        <Divider />

        {/* CONTACT */}
        <section id={SECTION_IDS.contact} className="section">
          <Title level={2}>Contact</Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card>
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Text>
                    Email: <a href={`mailto:${profile.email}`}>{profile.email}</a>
                  </Text>
                  <Text>
                    GitHub: <a href={profile.github} target="_blank" rel="noreferrer">{profile.github}</a>
                  </Text>
                  <Text>
                    LinkedIn: <a href={profile.linkedin} target="_blank" rel="noreferrer">{profile.linkedin}</a>
                  </Text>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Send a message (demo)">
                <Form layout="vertical" form={form}>
                  <Form.Item
                    label="Your Name"
                    name="name"
                    rules={[{ required: true, message: "Please input your name" }]}
                  >
                    <Input placeholder="Name" />
                  </Form.Item>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Please input your email" },
                      { type: "email", message: "Invalid email" },
                    ]}
                  >
                    <Input placeholder="Email" />
                  </Form.Item>
                  <Form.Item
                    label="Message"
                    name="message"
                    rules={[{ required: true, message: "Please input a message" }]}
                  >
                    <Input.TextArea rows={4} placeholder="Say hi..." />
                  </Form.Item>

                  <Button type="primary" onClick={onSubmit}>
                    Send
                  </Button>
                </Form>
              </Card>
            </Col>
          </Row>
        </section>
      </Content>

      <Footer style={{ textAlign: "center" }}>
        <Text type="secondary">
          © {new Date().getFullYear()} {profile.name} • Built with React + Ant Design
        </Text>
      </Footer>
    </Layout>
  );
}
